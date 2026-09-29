// @ts-nocheck
// Server functions that sync the studio's data to Lovable Cloud.
// Every function is authenticated; RLS scopes rows to the signed-in user.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

const uuid = z.string().uuid();

export const loadStudioCloud = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId!;
    const s = context.supabase;
    const [projects, creations, chat, packs, storyboards, drafts] = await Promise.all([
      s.from("studio_projects").select("*").eq("user_id", uid),
      s
        .from("creations")
        .select("client_id, prompt, model, kind, aspect, status, url, error, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(60),
      s
        .from("chat_messages")
        .select("role, text")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })
        .limit(200),
      s
        .from("prompt_packs")
        .select("id, name, prompt, kind, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      s
        .from("storyboards")
        .select("id, title, concept, reference_urls, shots, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(30),
      s
        .from("director_drafts")
        .select("id, input, output, model, action, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);
    return {
      project:
        (projects.data ?? [])
          .filter((p) => p.name === "main")
          .map((p) => p.state as Json)[0] ?? null,

      creations: creations.data ?? [],
      chat: (chat.data ?? []).map((m) => ({ role: m.role, text: m.text })),
      packs: packs.data ?? [],
      storyboards: storyboards.data ?? [],
      drafts: drafts.data ?? [],
    };
  });

export const saveStudioProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data) =>
      z
        .object({
          name: z.string().default("main"),
          state: z.record(z.string(), z.unknown()),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("studio_projects")
      .upsert(
        { user_id: context.userId, name: data.name, state: data.state as Json },
        { onConflict: "user_id,name" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const creationInput = z.object({
  clientId: z.number(),
  prompt: z.string(),
  model: z.string(),
  kind: z.enum(["image", "video"]),
  aspect: z.string(),
  status: z.enum(["pending", "done", "error"]),
  url: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

export const syncCreations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ items: z.array(creationInput).max(60) }).parse(data))
  .handler(async ({ data, context }) => {
    if (!data.items.length) return { ok: true };
    const { error } = await context.supabase
      .from("creations")
      .upsert(
        data.items.map((c) => ({
          user_id: context.userId,
          client_id: c.clientId,
          prompt: c.prompt,
          model: c.model,
          kind: c.kind,
          aspect: c.aspect,
          status: c.status,
          url: c.url ?? null,
          error: c.error ?? null,
        })),
        { onConflict: "user_id,client_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const appendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ role: z.enum(["u", "a"]), text: z.string().max(20000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("chat_messages").insert({
      user_id: context.userId,
      role: data.role,
      text: data.text,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearCloudData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    await Promise.all([
      context.supabase.from("creations").delete().eq("user_id", uid),
      context.supabase.from("chat_messages").delete().eq("user_id", uid),
      context.supabase.from("studio_projects").delete().eq("user_id", uid),
    ]);
    return { ok: true };
  });

export const savePromptPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        name: z.string().min(1).max(120),
        prompt: z.string().min(1).max(8000),
        kind: z.enum(["image", "video"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("prompt_packs")
      .insert({
        user_id: context.userId,
        name: data.name,
        prompt: data.prompt,
        kind: data.kind,
      })
      .select("id, name, prompt, kind, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { pack: row };
  });

export const deletePromptPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: uuid }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("prompt_packs")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveStoryboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        title: z.string().min(1).max(160),
        concept: z.string().min(1).max(8000),
        referenceUrls: z.array(z.string().max(2000)).max(30),
        shots: z.array(z.record(z.string(), z.unknown())).max(60),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("storyboards")
      .insert({
        user_id: context.userId,
        title: data.title,
        concept: data.concept,
        reference_urls: data.referenceUrls,
        shots: data.shots as Json,
      })
      .select("id, title, concept, reference_urls, shots, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { storyboard: row };
  });

export const deleteStoryboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: uuid }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("storyboards")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveDirectorDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        input: z.string().min(1).max(8000),
        output: z.string().min(1).max(20000),
        model: z.string().max(200),
        action: z.enum(["treat", "film"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("director_drafts")
      .insert({
        user_id: context.userId,
        input: data.input,
        output: data.output,
        model: data.model,
        action: data.action,
      })
      .select("id, input, output, model, action, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { draft: row };
  });

export const deleteDirectorDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: uuid }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("director_drafts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
