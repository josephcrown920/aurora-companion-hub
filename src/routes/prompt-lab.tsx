import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/prompt-lab")({
  head: () => ({
    meta: [
      { title: "Prompt Lab — Seedream & Seedance prompt writer | Aurora" },
      {
        name: "description",
        content:
          "Describe the image or video you want and Aurora writes a production-grade Seedream or Seedance prompt, with a matching negative prompt.",
      },
      { property: "og:title", content: "Prompt Lab — Seedream & Seedance prompt writer" },
      {
        property: "og:description",
        content: "Turn a one-line idea into a cinematic Seedream or Seedance prompt in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
