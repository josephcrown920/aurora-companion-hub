import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = process.env["COMFYUI_BASE_URL"]?.trim().replace(/\/$/, "") || "http://127.0.0.1:8188";
const POLL_MS = Number(process.env["COMFYUI_POLL_MS"] || 1000);
const TIMEOUT_MS = Number(process.env["COMFYUI_TIMEOUT_MS"] || 300000);

function responseJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function requestComfy(path: string, init: RequestInit = {}) {
  const response = await fetch(BASE_URL + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await response.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data?.error?.message || data?.error || data?.raw || "ComfyUI request failed.");
  return data;
}

export const Route = createFileRoute("/api/canvas/comfy")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await requestComfy("/system_stats");
          return responseJson({ ok: true, data, baseUrl: BASE_URL });
        } catch (error) {
          return responseJson({ ok: false, error: error instanceof Error ? error.message : "ComfyUI unavailable.", baseUrl: BASE_URL }, 503);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json() as { workflow?: Record<string, unknown>; wait?: boolean; clientId?: string };
          if (!body.workflow) return responseJson({ ok: false, error: "workflow is required." }, 400);
          const clientId = body.clientId || crypto.randomUUID();
          const queued = await requestComfy("/prompt", { method: "POST", body: JSON.stringify({ prompt: body.workflow, client_id: clientId }) });
          const promptId = queued.prompt_id;
          if (!promptId || body.wait === false) return responseJson({ ok: true, promptId, queued, clientId });
          const started = Date.now();
          while (Date.now() - started < TIMEOUT_MS) {
            await new Promise((resolve) => setTimeout(resolve, POLL_MS));
            const history = await requestComfy("/history/" + encodeURIComponent(promptId));
            const entry = history?.[promptId];
            if (!entry) continue;
            if (entry.status?.status_str === "error") return responseJson({ ok: false, promptId, history: entry }, 500);
            if (entry.status?.completed || entry.outputs) return responseJson({ ok: true, promptId, outputs: entry.outputs || {}, history: entry });
          }
          return responseJson({ ok: false, promptId, error: "ComfyUI execution timed out." }, 504);
        } catch (error) {
          return responseJson({ ok: false, error: error instanceof Error ? error.message : "ComfyUI execution failed." }, 500);
        }
      },
    },
  },
});
