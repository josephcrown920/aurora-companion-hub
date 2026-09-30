import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_comfy_apps",
  title: "List ComfyUI apps",
  description: "List ComfyUI workflow apps available to the signed-in user (their own and public ones).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("How many to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("comfy_workflows")
      .select("id, name, description, kind, is_public, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const apps = (data ?? []).map((w) => ({
      id: w.id, name: w.name, description: w.description, kind: w.kind, is_public: w.is_public, updated_at: w.updated_at,
    }));
    return { content: [{ type: "text", text: JSON.stringify(apps) }], structuredContent: { apps } };
  },
});
