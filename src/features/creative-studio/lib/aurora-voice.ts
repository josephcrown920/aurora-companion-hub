// @ts-nocheck
// Streaming voice playback: reads PCM audio chunks from /api/speech (SSE)
// and schedules them on a shared Web Audio context so playback starts immediately.
//
// The context is created/unlocked from a real user gesture via primeSpeech();
// creating it later (inside an async reply handler) leaves it suspended in
// sandboxed preview iframes and nothing is ever heard.

let activeController: AbortController | null = null;
let sharedCtx: AudioContext | null = null;

type Ctor = typeof AudioContext;

function getCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Call from a click/keydown handler so audio is allowed to play later. */
export function primeSpeech(): void {
  const Ctor = getCtor();
  if (!Ctor) return;
  if (!sharedCtx || sharedCtx.state === "closed") {
    try {
      sharedCtx = new Ctor({ sampleRate: 24000 });
    } catch {
      sharedCtx = null;
      return;
    }
  }
  if (sharedCtx.state === "suspended") void sharedCtx.resume().catch(() => {});
  // A silent tick fully unlocks playback on iOS/Safari.
  try {
    const src = sharedCtx.createBufferSource();
    src.buffer = sharedCtx.createBuffer(1, 1, 24000);
    src.connect(sharedCtx.destination);
    src.start(0);
  } catch {
    // ignore
  }
}

export function stopSpeech() {
  activeController?.abort();
  activeController = null;
}

export async function speak(text: string, voice = "Kore"): Promise<void> {
  stopSpeech();
  const controller = new AbortController();
  activeController = controller;

  primeSpeech();
  const ctx = sharedCtx;
  if (!ctx) throw new Error("Audio is not available in this browser.");
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});

  let playhead = 0;
  let pending = new Uint8Array(0);

  const playChunk = (incoming: Uint8Array) => {
    const bytes = new Uint8Array(pending.length + incoming.length);
    bytes.set(pending);
    bytes.set(incoming, pending.length);
    const usable = bytes.length - (bytes.length % 2);
    pending = bytes.slice(usable);
    if (usable === 0) return;
    const samples = new Int16Array(bytes.buffer, 0, usable / 2);
    const floats = Float32Array.from(samples, (s) => s / 32768);
    const buffer = ctx.createBuffer(1, floats.length, 24000);
    buffer.copyToChannel(floats, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    if (playhead === 0) playhead = ctx.currentTime + 0.12;
    else playhead = Math.max(playhead, ctx.currentTime);
    source.start(playhead);
    playhead += buffer.duration;
  };

  try {
    const res = await fetch("/api/canvas/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(data.error?.message || `Voice failed (${res.status})`);
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffered = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffered += value;
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payloadText = line.slice(5).trim();
        if (!payloadText || payloadText === "[DONE]") continue;
        let payload: { type?: string; audio?: string };
        try {
          payload = JSON.parse(payloadText) as { type?: string; audio?: string };
        } catch {
          continue;
        }
        if (payload.type !== "speech.audio.delta" || !payload.audio) continue;
        const binary = atob(payload.audio);
        const chunk = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) chunk[i] = binary.charCodeAt(i);
        playChunk(chunk);
      }
    }
    // Let the queued audio finish before resolving so "speaking" state is honest.
    const remaining = Math.max(0, playhead - ctx.currentTime) * 1000;
    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  } catch (err) {
    if ((err as Error)?.name !== "AbortError") throw err;
  } finally {
    if (activeController === controller) activeController = null;
  }
}
