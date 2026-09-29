import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/comfy")({
  head: () => ({
    meta: [
      { title: "ComfyUI — Aurora Studio" },
      {
        name: "description",
        content: "Run saved ComfyUI workflows on your own GPU workers, with declared inputs and live results.",
      },
      { property: "og:title", content: "ComfyUI Apps — Aurora Studio" },
      { property: "og:description", content: "Import ComfyUI API workflows as reusable apps with inputs and live results on connected GPU workers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

