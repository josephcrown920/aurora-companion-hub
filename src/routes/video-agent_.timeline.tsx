// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
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
  const effects = [
    ["Boomerang", "Loop a selected beat"], ["Bar reveal", "Animated crop reveal"],
    ["Speed ramp", "Accelerate into the cut"], ["RGB split", "Chromatic impact hit"],
    ["White flash", "Beat-synced transition"], ["Motion blur", "Smooth camera movement"],
  ];
  const agents = [
    ["Orchestrator", "Routes every edit", "Ready"], ["GPT-6 Astra", "Creative edit planning", "Online"],
    ["Codex", "Timeline operations", "Online"], ["Dola Seed Pro", "ModelArk direction", "Online"],
    ["GLM", "Fast alternate planning", "Available"],
  ];
  return (
    <div className="aurora-body aurora-page aurora-editor-workstation">
      <StudioNav />
      <main className="aurora-editor-shell">
        <header className="aurora-editor-titlebar">
          <div><h1>Aurora Agent Editor</h1><p>AI-directed desktop video workstation</p></div>
          <div className="aurora-editor-status"><i /> Orchestrator connected · Autosaved</div>
        </header>
        <section className="aurora-editor-upper">
          <aside className="aurora-editor-pane">
            <div className="aurora-editor-tabs"><button className="aurora-editor-tab active">Media</button><button className="aurora-editor-tab">Effects</button><button className="aurora-editor-tab">Presets</button></div>
            <div className="aurora-editor-section-title">Effects & transitions <span>DRAG TO TIMELINE</span></div>
            <div className="aurora-editor-assets">
              {effects.map(([name, note]) => <div key={name} className="aurora-editor-asset effect"><b>{name}</b><small>{note}</small></div>)}
            </div>
            <div className="aurora-editor-section-title">Media library <span>PROJECT</span></div>
            <div className="aurora-editor-import">＋ Import or drop media</div>
          </aside>
          <section className="aurora-editor-monitor">
            <div className="aurora-editor-monitor-bar"><span>Player</span><span>Fit · 100%</span></div>
            <div className="aurora-editor-screen"><div className="aurora-editor-screen-copy"><strong>Program monitor</strong><small>Select a clip to preview the AI-directed cut</small></div></div>
            <div className="aurora-editor-transport"><span>00:00:00:00</span><span>◀</span><b>▶</b><span>▶</span><span>00:00:30:00</span></div>
          </section>
          <aside className="aurora-editor-pane orchestrator">
            <div className="aurora-editor-tabs"><button className="aurora-editor-tab active">Agents</button><button className="aurora-editor-tab">Inspector</button></div>
            <div className="aurora-editor-section-title">Agent orchestrator <span>MODELARK + AI GATEWAY</span></div>
            <div className="aurora-agent-stack">
              {agents.map(([name, note, status]) => <div className="aurora-agent-card" key={name}><i /><span><b>{name}</b><small>{note}</small></span><em>{status}</em></div>)}
            </div>
            <div className="aurora-editor-section-title">Active pipeline <span>AUTO</span></div>
            <div className="aurora-editor-asset"><b>Plan → Generate → Edit → Review</b><small>Dola/GLM plan, Seedream and Seedance create, Astra and Codex direct the timeline.</small></div>
          </aside>
        </section>
        <MultiTrackTimeline />
        <LayersEditor />
      </main>
    </div>
  );
}
