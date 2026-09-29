// @ts-nocheck
// Editor agent: Codex-style editing on top of the studio's layer timeline.
// The agent returns structured operations; the client applies them to the
// controlled LayersEditor state so every edit stays reversible in the UI.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildSystemPrompt } from "./aurora-skills";

const opSchema = z.object({
  op: z.enum(["add_layer", "update_layer", "remove_layer", "reorder_layer"]),
  type: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  prompt: z.string().optional(),
  kind: z.string().optional(),
  aspect: z.string().optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  opacity: z.number().optional(),
  scale: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  start: z.number().optional(),
  duration: z.number().optional(),
  direction: z.string().optional(),
});


const agentSchema = z.object({
  reply: z.string(),
  ops: z.array(opSchema),
});

export type EditorOp = z.infer<typeof opSchema>;

export const agentEdit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data) =>
      z
        .object({
          instruction: z.string().min(1).max(6000),
          layers: z
            .array(
              z.object({
                id: z.string(),
                type: z.string(),
                name: z.string(),
                visible: z.boolean(),
                locked: z.boolean(),
                opacity: z.number(),
                x: z.number(),
                y: z.number(),
                scale: z.number(),
                start: z.number(),
                duration: z.number(),
              }),
            )

            .max(60),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this studio yet. Add AI access and retry.");

    const { generateObject } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");

    const system = `${buildSystemPrompt(["cinematic"], [])}

SKILL — TIMELINE EDITING AGENT
You are Aurora's editing agent, the AI on top of the studio's video editor. You control a layer timeline: layers of type video, image, text, audio or overlay, each with name, opacity (0-1), scale, x/y offset, start (seconds) and duration (seconds), plus visible and locked flags.

Supported operations (op field):
- add_layer: set type, name, and when relevant start + duration in seconds. If it is a generated clip set prompt + kind ("image" or "video") + aspect ("1:1", "16:9" or "9:16") — the studio will generate it.
- update_layer: set id (use the exact id from the current layers), and only the fields that change: name, opacity, scale, x, y, start, duration, visible, locked.
- remove_layer: set id.
- reorder_layer: set id + direction ("up" or "down").

Timing rules:
- When asked for a total length, retime every layer with start + duration so the timeline ends exactly at that length, without gaps.
- Overlays, titles and audio beds usually span the shots they sit over.


Rules:
- Answer briefly in a confident creative-director voice, then list the exact operations.
- Only reference ids that exist in the current layers, except in add_layer.
- When the request needs new footage, emit an add_layer with a generation prompt instead of inventing assets that do not exist.
- Never combine edits that contradict each other. Keep the plan minimal — the smallest reliable set of operations.`;

    const { object: result } = await generateObject({
      model: createLovableAiGatewayProvider(apiKey)("google/gemini-2.5-flash"),
      schema: agentSchema,
      system,
      prompt: `Current layers:\n${JSON.stringify(data.layers)}\n\nInstruction: ${data.instruction}`,
    });

    const ops = result.ops
      .map((o) => ({ ...o, op: (o.op || "").trim() }))
      .filter((o) =>
        ["add_layer", "update_layer", "remove_layer", "reorder_layer"].includes(o.op),
      );

    return { reply: result.reply?.trim() || "Done.", ops };
  });
