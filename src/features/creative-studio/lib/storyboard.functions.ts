// Shot-by-shot storyboard agent: concept + reference images -> structured shots.
// Uses the Lovable AI Gateway (server-side key only).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildSystemPrompt } from "./aurora-skills";

const storyboardSchema = z.object({
  title: z.string(),
  logline: z.string(),
  shots: z.array(
    z.object({
      shot: z.number(),
      seconds: z.number(),
      title: z.string(),
      action: z.string(),
      camera: z.string(),
      lighting: z.string(),
      wardrobe: z.string().nullable(),
      prompt: z.string(),
    }),
  ),
});

export type StoryboardShot = z.infer<typeof storyboardSchema>["shots"][number];

export const generateStoryboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data) =>
      z
        .object({
          concept: z.string().min(1).max(6000),
          referenceUrls: z.array(z.string().max(2000)).max(30).default([]),
          shotCount: z.number().default(6),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this studio yet. Add AI access and retry.");

    const { structuredResponsesCall } = await import("./ai-gateway.server");

    const system = `${buildSystemPrompt(["cinematic", "prompting"], [])}

SKILL — SHOT-BY-SHOT STORYBOARD
You are the storyboard agent. Turn the creator's concept (plus any reference images) into a numbered shot list ready for AI video generation.

Rules:
- Produce exactly ${data.shotCount} shots unless the concept clearly needs fewer or more (stay between 4 and 10).
- Each shot: a punchy title, duration in seconds (2-12), the action on screen, the camera (lens + move), the lighting, wardrobe if visible, and a dense single-paragraph generation prompt (subject first, then action, environment, light, lens, style — under 80 words, no camera brand names).
- Keep continuity across shots: same subject, same wardrobe language, escalating energy toward the final shot.
- Use the reference images as identity/style anchors: describe what they show and how each shot uses them. Never copy real person identity unless the reference is clearly meant for it.
- Reply in the creator's world: cinematic, high-contrast, motivated light.`;

    const message: {
      role: "user";
      content: Array<{ type: "text"; text: string } | { type: "image"; image: string }>;
    } = {
      role: "user",
      content: [{ type: "text", text: `Concept: ${data.concept}` }],
    };
    for (const url of data.referenceUrls) {
      message.content.push({ type: "image", image: url });
    }

    const { data: storyboard } = await structuredResponsesCall({
      apiKey,
      model: "openai/gpt-6-astra",
      system,
      messages: [message],
      schema: storyboardSchema,
    });

    // Normalize output that ignores the requested count.
    const shots = storyboard.shots
      .slice(0, 12)
      .map((s, i) => ({
        shot: i + 1,
        seconds: Math.min(12, Math.max(2, Math.round(s.seconds || 5))),
        title: s.title?.trim() || `Shot ${i + 1}`,
        action: s.action?.trim() || "",
        camera: s.camera?.trim() || "",
        lighting: s.lighting?.trim() || "",
        wardrobe: s.wardrobe?.trim() || null,
        prompt: s.prompt?.trim() || "",
      }))
      .filter((s) => s.prompt);

    return { title: storyboard.title?.trim() || "Untitled storyboard", logline: storyboard.logline?.trim() || "", shots };
  });
