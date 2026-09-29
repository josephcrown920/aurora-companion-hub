import { createFileRoute } from "@tanstack/react-router";

const ARK_BASE = process.env["ARK_BASE_URL"]?.trim() || "https://ark.ap-southeast.bytepluses.com/api/v3";
const DIRECTOR_MODEL = process.env["ARK_AGENT_MODEL"]?.trim() || "dola-seed-2-1-turbo-260628";

interface ContentBody {
  brief: string;
  referenceAssetUrls?: string[];
  platforms?: string[];
  count?: number;
  aspectRatio?: "9:16" | "1:1" | "16:9";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const tools = [
  {
    type: "function",
    name: "create_content_plan",
    description: "Create a structured social content plan from a creative brief. Do not generate media; return concepts, hooks, shots, captions and production instructions.",
    parameters: {
      type: "object",
      properties: {
        concepts: { type: "array", items: { type: "object" } },
        notes: { type: "string" },
      },
      required: ["concepts"],
    },
  },
  {
    type: "function",
    name: "generate_media",
    description: "Request Aurora to generate media for a planned concept. Aurora routes image/video generation to the configured ModelArk media models.",
    parameters: {
      type: "object",
      properties: {
        mediaType: { type: "string", enum: ["image", "video"] },
        prompt: { type: "string" },
        referenceAssetUrls: { type: "array", items: { type: "string" } },
        aspectRatio: { type: "string", enum: ["9:16", "1:1", "16:9"] },
        durationSeconds: { type: "number" },
      },
      required: ["mediaType", "prompt"],
    },
  },
];

export const Route = createFileRoute("/api/canvas/canvas/content-agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("x-ark-key")?.trim() || process.env["ARK_API_KEY"]?.trim();
        if (!key) return json({ error: { code: "ARK_NOT_CONFIGURED", message: "ARK_API_KEY is not configured." } }, 503);

        const body = (await request.json().catch(() => ({}))) as ContentBody;
        const brief = body.brief?.trim();
        if (!brief) return json({ error: { message: "brief is required." } }, 400);

        const count = Math.min(Math.max(body.count || 5, 1), 50);
        const platforms = body.platforms?.length ? body.platforms : ["TikTok", "Instagram Reels", "YouTube Shorts"];
        const aspectRatio = body.aspectRatio || "9:16";

        const prompt = [
          "You are Aurora's creative director and content-production planner.",
          "Turn the user's brief into an executable short-form content batch.",
          `Create ${count} distinct concepts for: ${platforms.join(", ")}.`,
          `Default aspect ratio: ${aspectRatio}.`,
          body.referenceAssetUrls?.length ? `Reference assets are supplied: ${body.referenceAssetUrls.join(", ")}. Preserve identity/subject continuity and treat them as references, not as prompt text.` : "",
          "For every concept return: hook, concept, shot list, exact media prompts, caption, CTA, platform, aspect ratio, suggested duration, and edit notes.",
          "Do not invent unavailable model capabilities. Keep generation instructions provider-neutral so Aurora can route them.",
          brief,
        ].filter(Boolean).join("\n\n");

        const response = await fetch(`${ARK_BASE}/responses`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: DIRECTOR_MODEL,
            input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
            tools,
          }),
        });

        const raw = await response.text();
        if (!response.ok) return new Response(raw, { status: response.status, headers: { "Content-Type": "application/json" } });

        return new Response(JSON.stringify({
          ok: true,
          model: DIRECTOR_MODEL,
          count,
          platforms,
          aspectRatio,
          response: JSON.parse(raw),
        }), { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
