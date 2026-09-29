import { createFileRoute } from "@tanstack/react-router";

const ZENMUX_BASE = "https://zenmux.ai/api/v1";

interface ZmBody {
  kind: "image" | "video" | "videoStatus" | "chat" | "models";
  prompt?: string;
  size?: string;
  ratio?: string;
  duration?: number;
  taskId?: string;
  imageUrl?: string;
  imageUrls?: string[];
  messages?: { role: string; content: string }[];
  model?: string;
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function zmFetch(path: string, key: string, init?: RequestInit) {
  const res = await fetch(`${ZENMUX_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/canvas/zenmux")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key =
          request.headers.get("x-zenmux-key")?.trim() || process.env["ZENMUX_API_KEY"]?.trim();
        if (!key) return jsonError("Missing ZenMux API key. Add it in Settings.", 401);

        const body = (await request.json().catch(() => ({}))) as ZmBody;

        if (body.kind === "models") {
          return zmFetch("/models", key, { method: "GET" });
        }

        if (body.kind === "image") {
          if (!body.prompt) return jsonError("Missing prompt", 400);
          const payload: Record<string, unknown> = {
            model: body.model || "openai/gpt-image-1.5",
            prompt: body.prompt,
            size: body.size || "1024x1024",
          };
          const refs = (body.imageUrls ?? []).filter((u) => typeof u === "string" && u.trim());
          if (refs.length > 1) payload["image"] = refs;
          else if (refs[0] || body.imageUrl) payload["image"] = refs[0] ?? body.imageUrl;
          return zmFetch("/images/generations", key, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        if (body.kind === "video") {
          if (!body.prompt) return jsonError("Missing prompt", 400);
          const content: Record<string, unknown>[] = [{ type: "text", text: body.prompt }];
          const vrefs = (body.imageUrls ?? []).filter((u) => typeof u === "string" && u.trim());
          const allRefs = vrefs.length ? vrefs : body.imageUrl ? [body.imageUrl] : [];
          for (const url of allRefs) {
            content.push({ type: "image_url", image_url: { url } });
          }
          const payload: Record<string, unknown> = {
            model: body.model || "klingai/kling-3.0-turbo",
            content,
            resolution: body.ratio === "9:16" || body.ratio === "1:1" ? "720p" : "720p",
            duration: body.duration || 5,
          };
          if (body.ratio) payload["aspect_ratio"] = body.ratio;
          return zmFetch("/videos", key, { method: "POST", body: JSON.stringify(payload) });
        }

        if (body.kind === "videoStatus") {
          if (!body.taskId) return jsonError("Missing taskId", 400);
          return zmFetch(`/videos/${body.taskId}`, key, { method: "GET" });
        }

        if (body.kind === "chat") {
          if (!body.messages?.length) return jsonError("Missing messages", 400);
          return zmFetch("/chat/completions", key, {
            method: "POST",
            body: JSON.stringify({
              model: body.model || "z-ai/glm-4.7-flash-free",
              messages: body.messages,
            }),
          });
        }

        return jsonError("Unknown request kind", 400);
      },
    },
  },
});
