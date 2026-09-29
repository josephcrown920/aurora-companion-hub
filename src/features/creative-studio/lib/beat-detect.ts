// @ts-nocheck
// Browser-only: estimates BPM and onset times from an uploaded track.
export async function detectBeats(file: File): Promise<{ bpm: number; onsets: number[]; duration: number }> {
  const ctx = new AudioContext();
  const buf = await ctx.decodeAudioData(await file.arrayBuffer());
  void ctx.close();
  const data = buf.getChannelData(0);
  const hop = Math.floor(buf.sampleRate / 100); // 10ms frames
  const energy: number[] = [];
  for (let i = 0; i + hop < data.length; i += hop) {
    let s = 0;
    for (let j = 0; j < hop; j++) { const v = data[i + j] ?? 0; s += v * v; }
    energy.push(s);
  }
  const onsets: number[] = [];
  const win = 43;
  for (let i = win; i < energy.length; i++) {
    let avg = 0;
    for (let j = i - win; j < i; j++) avg += energy[j] ?? 0;
    avg /= win;
    const last = onsets[onsets.length - 1] ?? -1;
    const e = energy[i] ?? 0;
    if (e > avg * 1.6 && e > 1e-3 && i / 100 - last > 0.18) onsets.push(i / 100);
  }
  // BPM from the most common inter-onset interval, folded into 120–160 (trap/drill range).
  const counts = new Map<number, number>();
  for (let i = 1; i < onsets.length; i++) {
    let bpm = 60 / ((onsets[i] ?? 0) - (onsets[i - 1] ?? 0) || 0.5);
    while (bpm < 120) bpm *= 2;
    while (bpm > 160) bpm /= 2;
    const k = Math.round(bpm);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let bpm = 140;
  let best = 0;
  counts.forEach((c, k) => { if (c > best) { best = c; bpm = k; } });
  return { bpm, onsets: onsets.slice(0, 600), duration: buf.duration };
}
