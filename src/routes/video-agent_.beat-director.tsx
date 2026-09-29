// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import "@/features/creative-studio/aurora.css";
import { StudioNav, useLlm } from "@/features/creative-studio/components/studio/StudioNav";
import { detectBeats } from "@/features/creative-studio/lib/beat-detect";
import { beatDirector } from "@/features/creative-studio/lib/studio-agents.functions";
import { LOOKS } from "@/features/creative-studio/lib/pro-presets";
import { loadTimeline, newId, saveTimeline, type Clip, type TimelineDoc } from "@/features/creative-studio/lib/timeline-state";

export const Route = createFileRoute("/video-agent_/beat-director")({
  head: () => ({
    meta: [
      { title: "Beat Sync Director — Aurora Studio" },
      { name: "description", content: "Upload a trap or drill track and turn its beats into a shot-and-effects timeline." },
      { property: "og:title", content: "Beat Sync Director — Aurora Studio" },
      { property: "og:description", content: "Beat detection plus an AI music video director that cuts on the kick." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BeatDirectorPage,
});

function BeatDirectorPage() {
  const [llm] = useLlm();
  const [concept, setConcept] = useState("Rain-soaked Port Harcourt night, chrome car, Out The Mud energy");
  const [genre, setGenre] = useState<"trap" | "drill">("drill");
  const [bpm, setBpm] = useState(142);
  const [seconds, setSeconds] = useState(30);
  const [ratio, setRatio] = useState<TimelineDoc["ratio"]>("9:16");
  const [onsets, setOnsets] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState<Awaited<ReturnType<typeof beatDirector>> | null>(null);

  const onAudio = async (file: File | undefined) => {
    if (!file) return;
    setStatus("Listening to the track…");
    try {
      const r = await detectBeats(file);
      setBpm(r.bpm);
      setOnsets(r.onsets);
      setSeconds(Math.min(600, Math.round(r.duration)));
      setStatus(`Found ${r.bpm} BPM and ${r.onsets.length} hits across ${Math.round(r.duration)}s.`);
    } catch {
      setStatus("That file could not be read. Try an MP3 or WAV.");
    }
  };

  const run = async () => {
    setBusy(true);
    setStatus("The director is planning your cut…");
    try {
      const result = await beatDirector({ data: { model: llm, concept, genre, bpm, seconds, ratio, onsets } });
      setPlan(result);
      setStatus(result.reply);
    } catch {
      setStatus("Sign in and try again — the director needs your account.");
    } finally {
      setBusy(false);
    }
  };

  const sendToTimeline = () => {
    if (!plan) return;
    const doc = loadTimeline();
    const clips: Clip[] = plan.shots.map((s, i) => ({
      id: newId(),
      track: i % 3 === 1 ? "V2" : "V1",
      start: s.start,
      duration: Math.max(0.3, s.duration),
      name: s.title,
      kind: "video",
      prompt: s.prompt,
      camera: s.camera,
      effect: s.effect,
      look: s.look,
    }));
    const fx: Clip[] = plan.hits.slice(0, 60).map((h) => ({
      id: newId(),
      track: "V4",
      start: h.t,
      duration: 0.4,
      name: h.effect,
      kind: "overlay",
      effect: h.effect,
    }));
    saveTimeline({ ...doc, name: plan.title, ratio, bpm, genre, seconds, clips: [...clips, ...fx], hits: plan.hits });
    setStatus("Sent to the timeline — open Multi-Track Timeline to arrange it.");
  };

  return (
    <div className="aurora-body aurora-page">
      <StudioNav />
      <div className="aurora-wrap">
        <h1 className="aurora-page-title">Beat Sync Director</h1>
        <p className="aurora-page-sub">Drop your track, pick trap or drill, and get a cut that lands on the beat.</p>

        <div className="aurora-panel">
          <label className="aurora-field">
            Your track
            <input type="file" accept="audio/*" onChange={(e) => void onAudio(e.target.files?.[0])} />
          </label>
          <div className="aurora-row">
            <label className="aurora-field">
              Direction
              <select value={genre} onChange={(e) => setGenre(e.target.value as "trap" | "drill")}>
                <option value="drill">Drill — sliding 808s, fast jump cuts</option>
                <option value="trap">Trap — hard kicks, strobe and ramps</option>
              </select>
            </label>
            <label className="aurora-field">
              BPM
              <input type="number" value={bpm} min={60} max={200} onChange={(e) => setBpm(Number(e.target.value) || 140)} />
            </label>
            <label className="aurora-field">
              Length (s)
              <input type="number" value={seconds} min={4} max={600} onChange={(e) => setSeconds(Number(e.target.value) || 30)} />
            </label>
            <label className="aurora-field">
              Format
              <select value={ratio} onChange={(e) => setRatio(e.target.value as TimelineDoc["ratio"])}>
                <option value="9:16">9:16 Reel</option>
                <option value="16:9">16:9 Cinematic</option>
                <option value="1:1">1:1 Square</option>
              </select>
            </label>
          </div>
          <label className="aurora-field">
            Concept
            <textarea rows={3} value={concept} onChange={(e) => setConcept(e.target.value)} />
          </label>
          <div className="aurora-row">
            <button className="aurora-btn primary" onClick={() => void run()} disabled={busy || !concept.trim()}>
              {busy ? "Planning…" : "Plan the video"}
            </button>
            {plan && (
              <button className="aurora-btn" onClick={sendToTimeline}>
                Send to timeline
              </button>
            )}
          </div>
          {status && <p className="aurora-note">{status}</p>}
        </div>

        {plan && (
          <div className="aurora-panel">
            <h3>{plan.title}</h3>
            <ol className="aurora-shotlist">
              {plan.shots.map((s, i) => (
                <li key={i}>
                  <strong>
                    {s.start.toFixed(1)}s · {s.title}
                  </strong>
                  <span>{s.prompt}</span>
                  <em>
                    {s.camera} · {s.effect} · {LOOKS.find((l) => l.id === s.look)?.name ?? s.look}
                  </em>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
