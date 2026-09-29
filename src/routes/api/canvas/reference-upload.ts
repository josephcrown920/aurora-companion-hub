import { createFileRoute } from "@tanstack/react-router";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const Route = createFileRoute("/api/canvas/reference-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as HandleUploadBody;

          const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => ({
              allowedContentTypes: [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
                "image/heic",
                "image/heif",
                "video/mp4",
                "video/quicktime",
                "audio/mpeg",
                "audio/wav",
                "audio/x-wav",
              ],
              maximumSizeInBytes: 200 * 1024 * 1024,
              addRandomSuffix: true,
              tokenPayload: JSON.stringify({ purpose: "aurora-reference" }),
            }),
            onUploadCompleted: async () => {
              // Reference URLs are intentionally returned directly to the creator
              // flow. Aurora keeps provider/storage details out of the UI.
            },
          });

          return Response.json(jsonResponse);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Reference upload failed.";
          return Response.json({ error: "Reference upload failed.", detail: message }, { status: 400 });
        }
      },
    },
  },
});
