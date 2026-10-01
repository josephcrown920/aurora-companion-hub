// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtTime, loadTimeline, type Clip, type TimelineDoc } from "@/features/creative-studio/lib/timeline-state";
import { LOOKS, cssFilter, DEFAULT_ADJUST } from "@/features/creative-studio/lib/pro-presets";
import "@/features/creative-studio/aurora.css";
import "@/features/creative-studio/editor-workstation.css";
import { StudioNav } from "@/features/creative-studio/components/studio/StudioNav";
import { MultiTrackTimeline } from "@/features/creative-studio/components/video/MultiTrackTimeline";
import { LayersEditor } from "@/features/creative-studio/components/video/LayersEditor";
import { StudioDirectorPanel } from "@/features/creative-studio/components/video/StudioDirectorPanel";

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
  const [doc, setDoc] = useState<TimelineDoc>(() => loadTimeline());
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const lastTick = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timelineChanged = (event: Event) => setDoc((event as CustomEvent<TimelineDoc>).detail);
    const seek = (event: Event) => {
      setTime(Math.max(0, (event as CustomEvent<number>).detail));
      setPlaying(false);
    };
    const select = (event: Event) => {
      const clip = (event as CustomEvent<{ src?: string }>).detail;
      setSelectedClip(loadTimeline().clips.find((item) => item.src === clip?.src) ?? null);
    };
    window.addEventListener("aurora:timeline-change", timelineChanged);
    window.addEventListener("aurora:seek", seek);
    window.addEventListener("aurora:select-clip", select);
    return () => {
      window.removeEventListener("aurora:timeline-change", timelineChanged);
      window.removeEventListener("aurora:seek", seek);
      window.removeEventListener("aurora:select-clip", select);
    };
  }, []);
  useEffect(() => {
    // Hand-off from the Music Video flow: scenes + song queued for editing.
    const raw = localStorage.getItem("aurora_pending_imports");
    if (!raw) return;
    localStorage.removeItem("aurora_pending_imports");
    try {
      const items = JSON.parse(raw) as Array<{ name: string; src: string; kind: string; start?: number; duration?: number }>;
      for (const item of items) window.dispatchEvent(new CustomEvent("aurora:import-media", { detail: item }));
      const first = items.find((i) => i.kind === "video");
      if (first) setTime(first.start ?? 0);
    } catch { /* ignore bad hand-off */ }
  }, []);
  const importMedia = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!/^(video|audio|image)\//.test(file.type)) continue;
      const url = URL.createObjectURL(file);
      const kind = file.type.split("/")[0];
      let duration = 5;
      if (kind !== "image") {
        const probe = document.createElement(kind === "audio" ? "audio" : "video");
        probe.preload = "metadata";
        probe.src = url;
        duration = await new Promise<number>((resolve) => {
          probe.onloadedmetadata = () => resolve(Number.isFinite(probe.duration) ? probe.duration : 5);
          probe.onerror = () => resolve(5);
        });
        probe.removeAttribute("src");
        probe.load();
      }
      window.dispatchEvent(new CustomEvent("aurora:import-media", { detail: { name: file.name, src: url, kind, duration } }));
    }
  };
  const activeVisual = [...doc.clips].filter((clip) => clip.src && clip.kind !== "audio" && time >= clip.start && time < clip.start + clip.duration)
    .sort((a, b) => a.track.localeCompare(b.track))[0] ?? null;
  const visual = activeVisual ?? (!playing ? selectedClip : null);
  const look = LOOKS.find((item) => item.id === visual?.look || (visual?.effect === "vhs" && item.id === "vhs") || (visual?.effect === "bw" && item.id === "noir"));
  const previewFilter = look ? cssFilter({ ...DEFAULT_ADJUST, ...look.adjust }) : visual?.effect === "blur" ? "blur(2px)" : undefined;
  const audioClips = doc.clips.filter((clip) => clip.src && clip.kind === "audio");

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("aurora:playhead-change", { detail: time }));
    const clip = activeVisual;
    const video = videoRef.current;
    if (video && clip?.kind === "video") {
      const target = (clip.sourceOffset ?? 0) + Math.max(0, time - clip.start);
      if (Math.abs(video.currentTime - target) > 0.1) video.currentTime = target;
      if (playing) void video.play().catch(() => setPlaying(false));
      else video.pause();
    }
    for (const clip of audioClips) {
      const player = audioRefs.current[clip.id];
      if (!player) continue;
      const active = time >= clip.start && time < clip.start + clip.duration;
      if (!active || !playing) player.pause();
      if (active) {
        const target = (clip.sourceOffset ?? 0) + time - clip.start;
        if (Math.abs(player.currentTime - target) > 0.1) player.currentTime = target;
        if (playing) void player.play().catch(() => setPlaying(false));
      }
    }
  }, [time, playing, activeVisual?.id, doc]);

  useEffect(() => {
    if (!playing) return;
    lastTick.current = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = Math.min((now - lastTick.current) / 1000, 0.25);
      lastTick.current = now;
      setTime((previous) => {
        if (previous + elapsed >= doc.seconds) {
          setPlaying(false);
          return doc.seconds;
        }
        return previous + elapsed;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, doc.seconds]);
  const effects = [
    ["freeze", "Boomerang", "Loop a selected beat"], ["zoom", "Bar reveal", "Animated crop reveal"],
    ["speed", "Speed ramp", "Accelerate into the cut"], ["rgb", "RGB split", "Chromatic impact hit"],
    ["flash", "White flash", "Beat-synced transition"], ["blur", "Motion blur", "Smooth camera movement"],
    ["vhs", "VHS filter", "Retro tape look"], ["bw", "Black & white", "Mono film grade"], ["glitch", "Glitch", "Digital glitch hit"],
    ["bgremove", "Background removal", "Cut subject onto a new layer"], ["layer", "Layer overlay", "Stack a clip on V2–V4"], ["switch", "Scene switch", "Hard switch between clips on the beat"],
  ];
  const agents = [
    ["AI edit planner", "Preview and approve changes below"], ["Gemini Flash", "AI editor model"],
    ["ModelArk director", "Open Generator & Director to plan shots"],
  ];
  return (
    <div className="aurora-body aurora-page aurora-editor-workstation">
      <StudioNav />
      <main className="aurora-editor-shell">
        <header className="aurora-editor-titlebar">
          <div><h1>Aurora Agent Editor</h1><p>AI-directed desktop video workstation</p></div>
          <div className="aurora-editor-status">Edits saved locally · Reimport files after refresh</div>
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
            <input ref={fileRef} type="file" accept="video/*,audio/*,image/*" multiple hidden onChange={(event) => void importMedia(event.target.files)} />
            <Button type="button" variant="outline" className="aurora-editor-import" onClick={() => fileRef.current?.click()}>＋ Import media to timeline</Button>
          </aside>
          <section className="aurora-editor-monitor">
            <div className="aurora-editor-monitor-bar"><span>Program monitor</span><span>{fmtTime(time)} / {fmtTime(doc.seconds)}</span></div>
            <div className={`aurora-editor-screen${visual?.effect === "glitch" ? " has-glitch" : ""}`}>{visual?.src ? visual.kind === "video" ? <video key={visual.id} ref={videoRef} src={visual.src} style={{ filter: previewFilter }} playsInline /> : <img src={visual.src} style={{ filter: previewFilter }} alt={visual.name} /> : <div className="aurora-editor-screen-copy"><strong>Program monitor</strong><small>Import media or select a clip to preview</small></div>}</div>
            <div className="aurora-editor-transport" aria-label="Timeline playback">
              <Button size="icon" variant="ghost" title="Back to start" aria-label="Back to start" onClick={() => { setPlaying(false); setTime(0); }}><SkipBack /></Button>
              <Button size="icon" variant="ghost" title={playing ? "Pause" : "Play"} aria-label={playing ? "Pause" : "Play"} onClick={() => { if (time >= doc.seconds) setTime(0); setPlaying((value) => !value); }}>{playing ? <Pause /> : <Play />}</Button>
              <input aria-label="Scrub timeline" type="range" min={0} max={doc.seconds} step={1 / 30} value={Math.min(time, doc.seconds)} onChange={(event) => { setPlaying(false); setTime(Number(event.target.value)); }} />
            </div>
            {audioClips.map((clip) => <audio key={clip.id} ref={(element) => { audioRefs.current[clip.id] = element; }} src={clip.src} preload="metadata" />)}
          </section>
          <aside className="aurora-editor-pane orchestrator">
            <div className="aurora-editor-tabs"><span className="aurora-editor-tab active">AI editor</span></div>
            <StudioDirectorPanel />
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
