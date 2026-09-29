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