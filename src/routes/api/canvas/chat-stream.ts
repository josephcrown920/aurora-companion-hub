import { createFileRoute } from "@tanstack/react-router";

const ARK_CHAT = "https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions";
const ZENMUX_CHAT = "https://zenmux.ai/api/v1/chat/completions";

interface StreamBody {
  provider?: "ark" | "zenmux";
  model?: string;
  messages?: { role: string; content: string }[];
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/canvas/chat-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as StreamBody;
        const provider = body.provider === "zenmux" ? "zenmux" : "ark";
        if (!body.messages?.length) return jsonError("Missing messages", 400);

        const key =
          provider === "zenmux"
            ? process.env["ZENMUX_API_KEY"]?.trim()
            : request.headers.get("x-ark-key")?.trim() || process.env["ARK_API_KEY"]?.trim();
        if (!key) return jsonError("Missing API key for this provider.", 401);

        const upstream = await fetch(provider === "zenmux" ? ZENMUX_CHAT : ARK_CHAT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: body.model || (provider === "zenmux" ? "z-ai/glm-4.7-flash-free" : "seed-2-0-pro-260328"),
            messages: body.messages,
            stream: true,
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          let message = `Chat failed (${upstream.status}).`;
          try {
            const parsed = JSON.parse(text) as { error?: { message?: string } };
            if (parsed.error?.message) message = parsed.error.message;
          } catch {
            if (text) message = text.slice(0, 300);
          }
          return jsonError(message, upstream.status === 401 ? 401 : 502);
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
