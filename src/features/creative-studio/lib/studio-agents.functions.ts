// @ts-nocheck
// Pro Suite AI: switchable LLMs, beat-synced music video director, workflow steps.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LLM_IDS } from "./pro-presets";

const model = z.enum(LLM_IDS);

function key() {
  const k = process.env["LOVABLE_API_KEY"];
  if (!k) throw new Error("AI is not configured for this studio yet.");
  return k;
}

export const askLlm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ model, system: z.string().max(4000).optional(), prompt: z.string().min(1).max(12000) }).parse(d))
  .handler(async ({ data }) => {
    const { textCall } = await import("./ai-gateway.server");
    const text = await textCall({
      apiKey: key(),
      model: data.model,
      system: data.system || "You are Aurora, the creative director for NBA Josh (Out The Mud Records, Port Harcourt). Be brief, cinematic and practical.",
      prompt: data.prompt,
    });
    return { text };
  });

export type DirectorShot = { start: number; duration: number; title: string; prompt: string; camera: string; effect: string; look: string };
export type DirectorPlan = { title: string; reply: string; shots: DirectorShot[]; hits: { t: number; effect: string; kind: string }[] };

export const beatDirector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      model,
      concept: z.string().min(1).max(6000),
      genre: z.enum(["trap", "drill"]),
      bpm: z.number().min(60).max(200),
      seconds: z.number().min(4).max(600),
      ratio: z.string().max(8),
      onsets: z.array(z.number()).max(600).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { textCall, parseJsonLoose } = await import("./ai-gateway.server");
    const beat = 60 / data.bpm;
    const system = `SKILL — MUSIC VIDEO DIRECTOR (TRAP & DRILL BEAT ADAPTATION)
You direct music videos for NBA Josh — Port Harcourt rapper, Out The Mud Records: cinematic, chrome, rain, gritty street luxury.
You cut on the beat. One beat = ${beat.toFixed(3)}s at ${data.bpm} BPM. Shots start on bar lines (every ${(beat * 4).toFixed(2)}s) or half-bars on energetic sections.
Genre rules:
- drill: sliding 808s → camera shake + invert hits on the slide; snares on 3 → RGB split / glitch; dark desaturated looks (drill, noir, rain).
- trap: hard kicks → white flash / zoom punch; hat rolls → strobe; drops → speed ramp or freeze; warmer looks (trap, mud, chrome).
Build: intro (tease), hook (fast cuts, most effects), verse (performance + story), outro (slow, letterbox). End the video cleanly on the final downbeat.
Effects allowed: flash, shake, zoom, rgb, glitch, strobe, speed, freeze, blur, flare, rain, smoke, letterbox, invert.
Looks allowed: mud, rain, chrome, drill, trap, vhs, noir, neon, soft, hdr.
Return ONLY JSON: {"title":string,"reply":string (2 sentences, director voice),"shots":[{"start":number,"duration":number,"title":string,"prompt":string (a full Seedance video prompt, ratio ${data.ratio}),"camera":string,"effect":string,"look":string}],"hits":[{"t":number,"effect":string,"kind":string}]}
Shots must cover 0 → ${data.seconds}s with no gaps. Max 24 shots, max 120 hits.`;
    const raw = await textCall({
      apiKey: key(),
      model: data.model,
      system,
      prompt: `Genre: ${data.genre}. Length: ${data.seconds}s. Ratio: ${data.ratio}.${data.onsets?.length ? ` Detected onsets (s): ${data.onsets.slice(0, 200).join(",")}` : ""}\nConcept: ${data.concept}`,
    });
    const plan = parseJsonLoose<DirectorPlan>(raw);
    const clamp = (n: unknown, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number(n) || 0));
    return {
      title: String(plan.title || "Untitled video").slice(0, 120),
      reply: String(plan.reply || "Plan ready.").slice(0, 600),
      shots: (plan.shots || []).slice(0, 24).map((s) => ({
        start: clamp(s.start, 0, data.seconds), duration: clamp(s.duration, 0.2, data.seconds),
        title: String(s.title || "Shot").slice(0, 80), prompt: String(s.prompt || "").slice(0, 2000),
        camera: String(s.camera || "").slice(0, 120), effect: String(s.effect || "").slice(0, 30), look: String(s.look || "").slice(0, 30),
      })),
      hits: (plan.hits || []).slice(0, 120).map((h) => ({ t: clamp(h.t, 0, data.seconds), effect: String(h.effect || "flash").slice(0, 30), kind: String(h.kind || "beat").slice(0, 30) })),
    } satisfies DirectorPlan;
  });
