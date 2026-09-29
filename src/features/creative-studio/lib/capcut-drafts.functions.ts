import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export const listCapcutDrafts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("capcut_drafts")
      .select("id,name,version,ratio,layers,duration,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((d) => ({ ...d, layers: d.layers as Json, duration: Number(d.duration) }));
  });

export const saveCapcutDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        ratio: z.string().max(10),
        duration: z.number(),
        layers: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))).max(60),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: last } = await context.supabase
      .from("capcut_drafts")
      .select("version")
      .eq("name", data.name)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const version = (last?.version ?? 0) + 1;
    const { error } = await context.supabase.from("capcut_drafts").insert({
      user_id: context.userId,
      name: data.name,
      version,
      ratio: data.ratio,
      duration: data.duration,
      layers: data.layers as Json,
    });
    if (error) throw new Error(error.message);
    return { version };
  });

export const deleteCapcutDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("capcut_drafts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
