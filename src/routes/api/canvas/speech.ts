import { createFileRoute } from "@tanstack/react-router";

const TTS_URL = "https://ai.gateway.lovable.dev/v1/audio/speech";
const MODEL = "google/gemini-3.1-flash-tts-preview";

interface SpeechBody {
  text?: string;
  voice?: string;
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/canvas/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return jsonError("Voice is not configured.", 500);

        const body = (await request.json().catch(() => ({}))) as SpeechBody;
        const text = (body.text ?? "").trim().slice(0, 2500);
        if (!text) return jsonError("Nothing to speak.", 400);
        const voice = /^[A-Za-z]{2,20}$/.test(body.voice ?? "") ? body.voice! : "Kore";

        const upstream = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            stream_format: "sse",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Say warmly and conversationally, like a confident creative director: ${text}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
            },
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          let message = `Voice failed (${upstream.status}).`;
          try {
            const parsed = JSON.parse(detail) as { error?: { message?: string } };
            if (parsed.error?.message) message = parsed.error.message;
          } catch {
            if (detail) message = detail.slice(0, 300);
          }
          return jsonError(message, upstream.status);
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
