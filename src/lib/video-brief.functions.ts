/**
 * Co-planning brief for the Aurora Video Agent. The ModelArk agent drafts a
 * creative brief with the creator; nothing is produced until they approve it.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { routedGenerate } from "@/lib/ai-router";

const BriefSchema = z.object({
  title: z.string(),
  logline: z.string(),
  audience: z.string(),
  tone: z.string(),
  visualStyle: z.string(),
  beats: z.array(z.string()),
  questions: z.array(z.string()),
});
export type VideoBrief = z.infer<typeof BriefSchema>;

const SYSTEM = `You are Aurora's co-planning team (director, writer, producer) working WITH the creator.
Draft a concise creative brief for their video. Do not start production.
- title: short working title
- logline: one or two sentences on what the video is
- audience: who it is for
- tone: mood and energy
- visualStyle: look, camera, lighting, colour
- beats: 4-8 story beats in order, one line each
- questions: 0-3 short questions you still need the creator to answer
If the creator gives feedback on a previous brief, revise that brief and keep what they didn't ask to change.`;

export const draftVideoBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        idea: z.string().min(3).max(4000),
        style: z.string().max(40),
        durationSec: z.number().int().min(5).max(600),
        previous: BriefSchema.optional(),
        feedback: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const prompt = [
      `Creator idea: ${data.idea}`,
      `Preferred style: ${data.style}. Target length: ${data.durationSec}s.`,
      data.previous ? `Previous brief: ${JSON.stringify(data.previous)}` : "",
      data.feedback ? `Creator feedback: ${data.feedback}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const r = await routedGenerate({
      system: SYSTEM,
      prompt,
      schema: BriefSchema,
      routingMode: "modelark-free",
    });
    const b = r.output as VideoBrief;
    return { ...b, beats: b.beats.slice(0, 10), questions: b.questions.slice(0, 3) };
  });
