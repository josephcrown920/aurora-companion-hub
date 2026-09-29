import { createFileRoute } from "@tanstack/react-router";

const ARK_BASE = process.env["ARK_BASE_URL"]?.trim() || "https://ark.ap-southeast.bytepluses.com/api/v3";
const DEFAULT_MODEL = process.env["ARK_AGENT_MODEL"]?.trim() || "dola-seed-2-1-turbo-260628";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

interface ModelArkBody {
  action?: "chat" | "models";
  model?: string;
  messages?: ChatMessage[];
  input?: unknown;
  tools?: unknown[];
  previous_response_id?: string;
  stream?: boolean;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getKey(request: Request) {
  return request.headers.get("x-ark-key")?.trim() || process.env["ARK_API_KEY"]?.trim();
}

async function ark(request: Request, path: string, init: RequestInit) {
  const key = getKey(request);
  if (!key) return json({ error: { code: "ARK_NOT_CONFIGURED", message: "ARK_API_KEY is not configured." } }, 503);

  const response = await fetch(`${ARK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
  });
}

export const Route = createFileRoute("/api/canvas/canvas/modelark")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as ModelArkBody;

        if (body.action === "models") {
          return ark(request, "/models?page_size=200", { method: "GET" });
        }

        const messages = body.messages || [];
        if (!messages.length && body.input === undefined) {
          return json({ error: { message: "Provide messages or input." } }, 400);
        }

        // Responses API is the canonical agent/tool-calling path used by Aurora.
        const payload: Record<string, unknown> = {
          model: body.model || DEFAULT_MODEL,
          input: body.input ?? messages,
        };

        if (body.tools) payload.tools = body.tools;
        if (body.previous_response_id) payload.previous_response_id = body.previous_response_id;
        if (body.stream !== undefined) payload.stream = body.stream;

        return ark(request, "/responses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
    },
  },
});
