// Unified Studio Director: DolaSeed (via ModelArk) drives the shared timeline
// using a persistent per-project brief + memory that auto-grows each turn.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DOLA_MODEL = "dola-seed-2-1-turbo-260628";

export type StudioProject = {
  id: string;
  title: string;
  brief: string;
  context_notes: string[];
  activity: { at: string; role: string; text: string }[];
};

const clipSchema = z.object({
  id: z.string(), track: z.string(), start: z.number(), duration: z.number(),
  name: z.string(), kind: z.string(), effect: z.string().optional(), look: z.string().optional(),
});

const opSchema = z.object({
  op: z.enum(["update_clip", "remove_clip"]),
  id: z.string(),
  start: z.number().optional(), duration: z.number().optional(), track: z.string().optional(),
  name: z.string().optional(), effect: z.string().optional(), look: z.string().optional(),
});
export type DirectorOp = z.infer<typeof opSchema>;

const replySchema = z.object({
  reply: z.string(),
  memory: z.array(z.string()).default([]),
  brief_update: z.string().optional(),
  ops: z.array(opSchema).default([]),
});

async function loadOrCreate(supabase: any, userId: string): Promise<StudioProject> {
  const { data } = await supabase.from("video_studio_projects").select("id,title,brief,context_notes,activity")
    .eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (data) return data as StudioProject;
  const { data: created, error } = await supabase.from("video_studio_projects")
    .insert({ user_id: userId, title: "Untitled project" }).select("id,title,brief,context_notes,activity").single();
  if (error) throw new Error(error.message);
  return created as StudioProject;
}

export const getStudioProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => loadOrCreate(context.supabase, context.userId));

export const saveStudioProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    id: z.string().uuid(), title: z.string().min(1).max(160), brief: z.string().max(12000),
    context_notes: z.array(z.string().max(400)).max(80),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("video_studio_projects")
      .update({ title: data.title, brief: data.brief, context_notes: data.context_notes }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const directorTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    projectId: z.string().uuid(),
    message: z.string().min(1).max(4000),
    seconds: z.number(),
    clips: z.array(clipSchema).max(120),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: project, error } = await context.supabase.from("video_studio_projects")
      .select("id,title,brief,context_notes,activity").eq("id", data.projectId).single();
    if (error || !project) throw new Error("Project not found");
    const p = project as StudioProject;
    const { modelArkResponses, modelArkText, modelArkTextModel } = await import("@/lib/modelark.server");

    const system = `You are DolaSeed, Aurora's lead video director. You run BOTH the studio (planning, briefs, shots) and the editor (the shared multi-track timeline) as one system.
Tracks: V4 FX/overlays, V3 titles, V2 b-roll, V1 main, A1 vocals, A2 808, A3 SFX.
Effects you may set on clips: zoom, shake, speed, rgb, flash, blur, vhs, bw, glitch.
You may propose timeline ops: update_clip (id + changed fields: start, duration, track, name, effect, look) or remove_clip (id). Only use existing clip ids. The user approves ops before they apply.
Memory: extract durable project facts (style, characters, song, decisions, preferences) into "memory" as short new notes not already listed. If the creative brief should evolve, return the full rewritten brief in "brief_update".
Reply briefly, as a confident creative director. Return ONLY JSON: {"reply":"...","memory":["..."],"brief_update":"optional","ops":[...]}`;

    const recent = (p.activity || []).slice(-12).map((a) => `${a.role}: ${a.text}`).join("\n");
    const prompt = `PROJECT: ${p.title}\nBRIEF:\n${p.brief || "(empty — help fill it)"}\n\nMEMORY:\n${(p.context_notes || []).map((n) => `- ${n}`).join("\n") || "(none)"}\n\nRECENT CONVERSATION:\n${recent || "(none)"}\n\nTIMELINE (${data.seconds}s):\n${JSON.stringify(data.clips)}\n\nUSER: ${data.message}`;
    const input = [{ role: "system", content: system }, { role: "user", content: prompt }];

    let raw = "";
    let model = DOLA_MODEL;
    try {
      raw = modelArkText(await modelArkResponses({ input, model: DOLA_MODEL }));
    } catch {
      model = modelArkTextModel();
      raw = modelArkText(await modelArkResponses({ input, model }));
    }
    const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
    let parsed: z.infer<typeof replySchema>;
    try {
      parsed = replySchema.parse(JSON.parse(raw.slice(s, e + 1)));
    } catch {
      parsed = { reply: raw.trim() || "I couldn't form a plan — try rephrasing.", memory: [], ops: [] };
    }
    const ids = new Set(data.clips.map((c) => c.id));
    const ops = parsed.ops.filter((o) => ids.has(o.id));
    const notes = [...(p.context_notes || [])];
    for (const m of parsed.memory) if (m.trim() && !notes.includes(m.trim())) notes.push(m.trim().slice(0, 400));
    const now = new Date().toISOString();
    const activity = [...(p.activity || []), { at: now, role: "user", text: data.message.slice(0, 1000) }, { at: now, role: "director", text: parsed.reply.slice(0, 1000) }].slice(-60);
    const brief = parsed.brief_update?.trim() ? parsed.brief_update.trim().slice(0, 12000) : p.brief;
    await context.supabase.from("video_studio_projects").update({ context_notes: notes.slice(-80), activity, brief }).eq("id", p.id);
    return { reply: parsed.reply, ops, brief, context_notes: notes.slice(-80), model };
  });
