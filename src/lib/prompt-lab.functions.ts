/**
 * Prompt Lab — turns a short creator idea into a production-grade prompt
 * tuned for either Seedream (images) or Seedance (video).
 *
 * Runs through the shared Aurora AI router so it inherits provider health,
 * fallbacks and decision logging like every other structured LLM call.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { routedGenerate } from "@/lib/ai-router";

export type PromptTarget = "seedream" | "seedance";

const SEEDREAM_SYSTEM = `You are a senior still-image prompt engineer for the Seedream text-to-image model.
Turn the creator's idea into ONE dense, comma-led prompt paragraph.
Always cover, in this order: subject + wardrobe, pose/expression, environment,
lens and camera body (e.g. 85mm f/1.4), lighting setup, colour grade, texture and
film stock, composition and aspect framing, and a short quality tail.
Never invent brand logos or real celebrities. Keep it under 130 words.`;

const SEEDANCE_SYSTEM = `You are a senior motion prompt engineer for the Seedance text/image-to-video model.
Turn the creator's idea into ONE dense prompt paragraph describing a single continuous shot.
Always cover, in this order: subject + wardrobe, the action beat over time, camera move
(dolly in, orbit, handheld push, static lock-off), lens, lighting and atmosphere,
colour grade, pacing/tempo and physics realism cues.
Describe only what a camera could capture in a few seconds — no cuts, no scene changes.
Never invent brand logos or real celebrities. Keep it under 130 words.`;

const PromptResultSchema = z.object({
  prompt: z.string(),
  negativePrompt: z.string(),
  notes: z.array(z.string()).max(5),
});

export type PromptLabResult = z.infer<typeof PromptResultSchema>;

export const generatePolishedPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      idea: z.string().trim().min(3).max(1200),
      target: z.enum(["seedream", "seedance"]),
      styleHint: z.string().trim().max(200).optional(),
      aspectRatio: z.string().trim().max(20).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const details = [
      `Creator idea: ${data.idea}`,
      data.styleHint ? `Style direction: ${data.styleHint}` : null,
      data.aspectRatio ? `Target aspect ratio: ${data.aspectRatio}` : null,
      `Return the final prompt, a matching negative prompt, and up to 3 short tips.`,
    ]
      .filter(Boolean)
      .join("\n");

    const { output } = await routedGenerate({
      system: data.target === "seedream" ? SEEDREAM_SYSTEM : SEEDANCE_SYSTEM,
      prompt: details,
      schema: PromptResultSchema,
      category: data.target === "seedream" ? "IMAGE_PROMPTS" : "VIDEO_PROMPTS",
    });

    return output;
  });
