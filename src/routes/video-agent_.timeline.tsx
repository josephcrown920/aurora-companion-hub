// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import "@/features/creative-studio/aurora.css";
import { StudioNav } from "@/features/creative-studio/components/studio/StudioNav";
import { MultiTrackTimeline } from "@/features/creative-studio/components/video/MultiTrackTimeline";
import { LayersEditor } from "@/features/creative-studio/components/video/LayersEditor";

export const Route = createFileRoute("/video-agent/timeline")({
  head: () => ({
    meta: [
      { title: "Multi-Track Timeline — Aurora Studio" },
      { name: "description", content: "Arrange video and audio tracks, snap clips to beats, add effects and export a CapCut draft." },
      { property: "og:title", content: "Multi-Track Timeline — Aurora Studio" },
      { property: "og:description", content: "V1–V4 video, A1–A3 audio, beat markers, split, trim and CapCut export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  return (
    <div className="aurora-body aurora-page">
      <StudioNav />
      <div className="aurora-wrap">
        <h1 className="aurora-page-title">Multi-Track Timeline</h1>
        <p className="aurora-page-sub">Four video tracks, three audio tracks, beat markers and CapCut export.</p>
        <MultiTrackTimeline />
        <LayersEditor />
      </div>
    </div>
  );
}
