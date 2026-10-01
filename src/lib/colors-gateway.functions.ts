import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startColorsGatewayPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ imagePath: z.string().min(1), videoPath: z.string().min(1), scene: z.enum(["colors", "court"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { createColorsPreview } = await import("./colors-gateway.server");
    return createColorsPreview(context.userId, data.imagePath, data.videoPath, data.scene);
  });

export const pollColorsGatewayPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ jobId: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    const { readColorsPreview } = await import("./colors-gateway.server");
    return readColorsPreview(context.userId, data.jobId);
  });

export const startMusicScene = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({
    imagePath: z.string().min(1).max(500),
    imageMime: z.enum(["image/jpeg", "image/png", "image/webp"]),
    brief: z.string().min(10).max(2000),
    sceneIndex: z.number().int().min(0).max(5),
    sceneCount: z.number().int().min(1).max(6),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { createMusicScene } = await import("./colors-gateway.server");
    return createMusicScene(context.userId, data.imagePath, data.brief, data.sceneIndex, data.sceneCount, data.imageMime);
  });