import { createFileRoute } from "@tanstack/react-router";
import NexusDolaStudioScaffold from "@/features/aurora-canvas/components/studio/NexusDolaStudioScaffold";

export const Route = createFileRoute("/aurora-studio-shell")({
  head: () => ({
    meta: [
      { title: "Nexus Dola Studio — Aurora Workspace Shell" },
      { name: "description", content: "Preview of the Nexus Dola multi-agent studio workspace for Aurora." },
      { property: "og:title", content: "Nexus Dola Studio — Aurora" },
      { property: "og:description", content: "Multi-agent studio workspace preview for Aurora creators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NexusDolaStudioScaffold,
});
