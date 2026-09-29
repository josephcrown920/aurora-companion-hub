import { createFileRoute } from "@tanstack/react-router";

const ARK_BASE = process.env["ARK_BASE_URL"]?.trim() || "https://ark.ap-southeast.bytepluses.com/api/v3";
const TOKEN = process.env["AURORA_MCP_TOKEN"]?.trim();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function authorized(request: Request) {
  if (!TOKEN) return false;
  const value = request.headers.get("authorization") || "";
  return value === `Bearer ${TOKEN}`;
}

function key() {
  return process.env["ARK_API_KEY"]?.trim();
}

export const Route = createFileRoute("/api/canvas/canvas/assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!TOKEN) return json({ error: { code: "ASSISTANT_NOT_CONFIGURED" } }, 503);
        if (!authorized(request)) return json({ error: { code: "UNAUTHORIZED" } }, 401);
        if (!key()) return json({ error: { code: "ARK_NOT_CONFIGURED" } }, 503);

        const body = await request.json().catch(() => ({})) as {
          tool?: string;
          arguments?: Record<string, unknown>;
        };

        const tool = body.tool;
        const args = body.arguments || {};

        if (tool === "aurora_list_models") {
          const r = await fetch(`${ARK_BASE}/models?page_size=200`, {
            headers: { Authorization: `Bearer ${key()}` },
          });
          return new Response(await r.text(), {
            status: r.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (tool === "aurora_chat") {
          const r = await fetch(`${ARK_BASE}/responses`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: args.model || process.env["ARK_AGENT_MODEL"] || "dola-seed-2-1-turbo-260628",
              input: args.input,
              tools: args.tools,
              previous_response_id: args.previous_response_id,
            }),
          });
          return new Response(await r.text(), {
            status: r.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (tool === "aurora_generate_image" || tool === "aurora_generate_video" || tool === "aurora_check_video") {
          // Keep media generation behind the existing Aurora media gateway.
          const kind =
            tool === "aurora_generate_image" ? "image" :
            tool === "aurora_generate_video" ? "video" : "videoStatus";

          const payload = { ...args, kind };
          const origin = new URL(request.url).origin;
          const r = await fetch(`${origin}/api/ark`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-ark-key": key()!,
            },
            body: JSON.stringify(payload),
          });

          return new Response(await r.text(), {
            status: r.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (tool === "aurora_plan_content") {
          if (typeof args.brief !== "string" || !args.brief.trim()) {
            return json({ error: { code: "BRIEF_REQUIRED" } }, 400);
          }

          const origin = new URL(request.url).origin;
          const r = await fetch(`${origin}/api/content-agent`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-ark-key": key()!,
            },
            body: JSON.stringify(args),
          });

          return new Response(await r.text(), {
            status: r.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        return json({
          error: { code: "UNKNOWN_TOOL", message: "Unsupported Aurora assistant tool." },
          available_tools: [
            "aurora_list_models",
            "aurora_chat",
            "aurora_plan_content",
            "aurora_generate_image",
            "aurora_generate_video",
            "aurora_check_video",
          ],
        }, 400);
      },
    },
  },
});
