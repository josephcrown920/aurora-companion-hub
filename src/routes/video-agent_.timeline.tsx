// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import "@/features/creative-studio/aurora.css";
import "@/features/creative-studio/editor-workstation.css";
import { StudioNav } from "@/features/creative-studio/components/studio/StudioNav";
import { MultiTrackTimeline } from "@/features/creative-studio/components/video/MultiTrackTimeline";
import { LayersEditor } from "@/features/creative-studio/components/video/LayersEditor";

export const Route = createFileRoute("/video-agent_/timeline")({
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
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewKind, setPreviewKind] = useState("video");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const select = (event: Event) => {
      const clip = (event as CustomEvent<{ src?: string; kind?: string }>).detail;
      if (clip?.src) { setPreviewUrl(clip.src); setPreviewKind(clip.kind ?? "video"); }
    };
    window.addEventListener("aurora:select-clip", select);
    return () => window.removeEventListener("aurora:select-clip", select);
  }, []);
  const importMedia = (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!/^(video|audio|image)\//.test(file.type)) continue;
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPreviewKind(file.type.split("/")[0] ?? "video");
      window.dispatchEvent(new CustomEvent("aurora:import-media", { detail: { name: file.name, src: url, kind: file.type.split("/")[0] } }));
    }
  };
  const effects = [
    ["freeze", "Boomerang", "Loop a selected beat"], ["zoom", "Bar reveal", "Animated crop reveal"],
    ["speed", "Speed ramp", "Accelerate into the cut"], ["rgb", "RGB split", "Chromatic impact hit"],
    ["flash", "White flash", "Beat-synced transition"], ["blur", "Motion blur", "Smooth camera movement"],
  ];
  const agents = [
    ["AI edit planner", "Preview and approve changes below"], ["GPT-6 Astra", "Current AI editor model"],
    ["ModelArk director", "Open Generator & Director to plan shots"],
  ];
  return (
    <div className="aurora-body aurora-page aurora-editor-workstation">
      <StudioNav />
      <main className="aurora-editor-shell">
        <header className="aurora-editor-titlebar">
          <div><h1>Aurora Agent Editor</h1><p>AI-directed desktop video workstation</p></div>
          <div className="aurora-editor-status">Timeline saved in this browser</div>
        </header>
        <section className="aurora-editor-upper">
          <aside className="aurora-editor-pane">
            <div className="aurora-editor-tabs"><span className="aurora-editor-tab active">Media · Effects · Presets</span></div>
            <div className="aurora-editor-section-title">Effects & transitions <span>DRAG TO TIMELINE</span></div>
            <div className="aurora-editor-assets">
              {effects.map(([id, name, note]) => (
                <div
                  key={id}
                  className="aurora-editor-asset effect"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("application/x-aurora-effect", id)}
                >
                  <b>{name}</b><small>{note}</small>
                </div>
              ))}
            </div>
            <div className="aurora-editor-section-title">Media library <span>PROJECT</span></div>
            <input ref={fileRef} type="file" accept="video/*,audio/*,image/*" multiple hidden onChange={(event) => importMedia(event.target.files)} />
            <button type="button" className="aurora-editor-import" onClick={() => fileRef.current?.click()}>＋ Import media to timeline</button>
          </aside>
          <section className="aurora-editor-monitor">
            <div className="aurora-editor-monitor-bar"><span>Player</span><span>Fit · 100%</span></div>
            <div className="aurora-editor-screen">{previewUrl ? previewKind === "video" ? <video src={previewUrl} controls playsInline /> : previewKind === "audio" ? <audio src={previewUrl} controls /> : <img src={previewUrl} alt="Selected timeline clip" /> : <div className="aurora-editor-screen-copy"><strong>Program monitor</strong><small>Import media or select a clip to preview</small></div>}</div>
          </section>
          <aside className="aurora-editor-pane orchestrator">
            <div className="aurora-editor-tabs"><span className="aurora-editor-tab active">AI editor</span></div>
            <div className="aurora-editor-section-title">Agent-assisted editing</div>
            <div className="aurora-agent-stack">
              {agents.map(([name, note]) => <div className="aurora-agent-card" key={name}><i /><span><b>{name}</b><small>{note}</small></span></div>)}
            </div>
            <div className="aurora-editor-section-title">Studio connections</div>
            <Link to="/video-agent" className="aurora-editor-asset"><b>Generator & Director →</b><small>ModelArk shot direction and generation</small></Link>
            <a href="#aurora-agent-edit" className="aurora-editor-asset"><b>AI edit commands ↓</b><small>Preview changes before applying</small></a>
          </aside>
        </section>
        <MultiTrackTimeline />
        <div id="aurora-agent-edit"><LayersEditor /></div>
      </main>
    </div>
  );
}
