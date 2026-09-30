import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_generations",
  title: "List my generations",
  description: "List the signed-in user's recent Aurora image and video generations.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("How many to return."),
    kind: z.string().optional().describe("Optional kind filter, e.g. image or video."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, kind }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("generations")
      .select("id, kind, mode, model, prompt, status, result_image_url, result_video_url, created_at")
      .eq("user_id", ctx.getUserId()!)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (kind) q = q.eq("kind", kind);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const generations = (data ?? []).map((g) => ({
      id: g.id, kind: g.kind, mode: g.mode, model: g.model, prompt: g.prompt, status: g.status,
      image: g.result_image_url, video: g.result_video_url, created_at: g.created_at,
    }));
    return { content: [{ type: "text", text: JSON.stringify(generations) }], structuredContent: { generations } };
  },
});
