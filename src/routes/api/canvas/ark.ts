import { createFileRoute } from "@tanstack/react-router";

const ARK_BASE = "https://ark.ap-southeast.bytepluses.com/api/v3";

interface ArkBody {
  kind: "image" | "video" | "videoStatus" | "chat" | "models";
  prompt?: string;
  size?: string;
  ratio?: string;
  duration?: number;
  taskId?: string;
  imageUrl?: string;
  imageUrls?: string[];
  imageRoles?: Array<"first_frame" | "last_frame" | "reference_image">;
  videoUrl?: string;
  audioUrl?: string;
  generateAudio?: boolean;
  watermark?: boolean;
  seed?: number;
  cameraFixed?: boolean;
  resolution?: "480p" | "720p" | "1080p" | "4k";
  messages?: { role: string; content: string }[];
  model?: string;
}

function jsonError(message: string, status: number, code?: string, details?: unknown) {
  return new Response(
    JSON.stringify({ error: { message, ...(code ? { code } : {}), ...(details ? { details } : {}) } }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

async function arkFetch(path: string, key: string, init?: RequestInit) {
  const res = await fetch(`${ARK_BASE}${path}`, {
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

function looksLikeRealPersonReferenceFailure(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("real person") ||
    normalized.includes("real human") ||
    normalized.includes("real people") ||
    normalized.includes("real-person") ||
    normalized.includes("真人") ||
    normalized.includes("真实人物") ||
    normalized.includes("may contain a real person")
  );
}

async function arkVideoFetch(path: string, key: string, init?: RequestInit) {
  const res = await fetch(`${ARK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();

  if (!res.ok && looksLikeRealPersonReferenceFailure(text)) {
    return new Response(
      JSON.stringify({
        error: {
          code: "REAL_PERSON_REFERENCE_REQUIRES_ASSET",
          message:
            "Seedance blocked a direct real-person reference. Authorize the person in the LAS material/virtual portrait library, then use the resulting asset://<ASSET_ID> reference. Motion/style-only references can still be used without sending the person's raw face to Seedance.",
          providerStatus: res.status,
        },
      }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/canvas/ark")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("x-ark-key")?.trim() || process.env["ARK_API_KEY"]?.trim();
        if (!key) return jsonError("Missing ARK API key. Add it in Settings.", 401);

        const body = (await request.json()) as ArkBody;

        if (body.kind === "models") {
          return arkFetch("/models?page_size=200", key, { method: "GET" });
        }

        if (body.kind === "image") {
          if (!body.prompt) return jsonError("Missing prompt", 400);
          const payload: Record<string, unknown> = {
            model: body.model || "seedream-5-0-260128",
            prompt: body.prompt,
            size: body.size || "2K",
            response_format: "url",
            watermark: false,
          };
          const refs = (body.imageUrls ?? []).filter((u) => typeof u === "string" && u.trim());
          if (refs.length > 1) payload["image"] = refs;
          else if (refs[0] || body.imageUrl) payload["image"] = refs[0] ?? body.imageUrl;
          return arkFetch("/images/generations", key, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        if (body.kind === "video") {
          if (!body.prompt) return jsonError("Missing prompt", 400);
          const model = body.model || "dreamina-seedance-2-5-260628";
          const ratio = body.ratio || "16:9";
          const duration = body.duration || 5;

          if (duration < 4 || duration > 30) {
            return jsonError("Seedance 2.5 duration must be between 4 and 30 seconds.", 400);
          }

          const content: Record<string, unknown>[] = [
            { type: "text", text: body.prompt.trim() },
          ];

          const vrefs = (body.imageUrls ?? []).filter((u) => typeof u === "string" && u.trim());
          const roles = body.imageRoles?.length === vrefs.length
            ? body.imageRoles
            : vrefs.map(() => "reference_image" as const);

          for (let i = 0; i < vrefs.length; i++) {
            content.push({
              type: "image_url",
              image_url: { url: vrefs[i] },
              role: roles[i] ?? "reference_image",
            });
          }

          if (body.videoUrl?.trim()) {
            content.push({
              type: "video_url",
              video_url: { url: body.videoUrl.trim() },
              role: "reference_video",
            });
          }

          if (body.audioUrl?.trim()) {
            content.push({
              type: "audio_url",
              audio_url: { url: body.audioUrl.trim() },
              role: "reference_audio",
            });
          }

          const payload: Record<string, unknown> = {
            model,
            content,
            ratio,
            duration,
            resolution: body.resolution || "720p",
            generate_audio: body.generateAudio ?? true,
            watermark: body.watermark ?? false,
          };
          if (body.seed !== undefined) payload["seed"] = body.seed;
          if (body.cameraFixed !== undefined) payload["camera_fixed"] = body.cameraFixed;

          return arkVideoFetch("/contents/generations/tasks", key, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        if (body.kind === "videoStatus") {
          if (!body.taskId) return jsonError("Missing taskId", 400);
          return arkVideoFetch(`/contents/generations/tasks/${encodeURIComponent(body.taskId)}`, key, {
            method: "GET",
          });
        }

        if (body.kind === "chat") {
          if (!body.messages?.length) return jsonError("Missing messages", 400);
          return arkFetch("/chat/completions", key, {
            method: "POST",
            body: JSON.stringify({
              model: body.model || "seed-2-0-pro-260328",
              messages: body.messages,
            }),
          });
        }

        return jsonError("Unknown request kind", 400);
      },
    },
  },
});
