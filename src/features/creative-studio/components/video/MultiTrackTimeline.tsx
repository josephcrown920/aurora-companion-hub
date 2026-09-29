// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AUDIO_TRACKS,
  CLIP_COLORS,
  TRACK_LABELS,
  TRACKS,
  VIDEO_TRACKS,
  beatTimes,
  clampClip,
  fmtTime,
  loadTimeline,
  newId,
  saveTimeline,
  snap,
  type Clip,
  type TimelineDoc,
  type TrackId,
} from "@/lib/timeline-state";
import { EFFECTS, LOOKS, TOOLS, VIDEO_PRESETS } from "@/features/creative-studio/lib/pro-presets";
import { buildCapCutDraft, buildEdl } from "@/features/creative-studio/lib/capcut-export";

const ROW_H = 46;

type Drag =
  | { mode: "move"; id: string; grabOffset: number }
  | { mode: "left"; id: string }
  | { mode: "right"; id: string }
  | null;

export function MultiTrackTimeline() {
  const [doc, setDoc] = useState<TimelineDoc>(() => loadTimeline());
  const [zoom, setZoom] = useState(28); // px per second
  const [playhead, setPlayhead] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [snapOn, setSnapOn] = useState(true);
  const [past, setPast] = useState<TimelineDoc[]>([]);
  const [future, setFuture] = useState<TimelineDoc[]>([]);
  const [muted, setMuted] = useState<TrackId[]>([]);
  const [locked, setLocked] = useState<TrackId[]>([]);
  const [note, setNote] = useState("");
  const lane = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag>(null);

  useEffect(() => saveTimeline(doc), [doc]);

  const grid = useMemo(() => {
    const beats = beatTimes(doc.bpm, doc.seconds);
    const onsets = doc.hits.map((h) => h.t);
    return [...new Set([...beats, ...onsets])].sort((a, b) => a - b);
  }, [doc.bpm, doc.seconds, doc.hits]);

  const push = useCallback((next: TimelineDoc) => {
    setPast((p) => [...p.slice(-49), doc]);
    setFuture([]);
    setDoc(next);
  }, [doc]);

  const undo = () => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1]!;
      setFuture((f) => [doc, ...f].slice(0, 50));
      setDoc(prev);
      return p.slice(0, -1);
    });
  };
  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0]!;
      setPast((p) => [...p, doc]);
      setDoc(next);
      return f.slice(1);
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const xToTime = (clientX: number) => {
    const box = lane.current?.getBoundingClientRect();
    if (!box) return 0;
    const t = (clientX - box.left + (lane.current?.scrollLeft ?? 0)) / zoom;
    return Math.min(doc.seconds, Math.max(0, t));
  };

  const setClips = (clips: Clip[]) => push({ ...doc, clips });

  const addClip = (track: TrackId, at = playhead) => {
    const kind = track.startsWith("A") ? "audio" : track === "V3" ? "text" : track === "V4" ? "overlay" : "video";
    const clip: Clip = {
      id: newId(),
      track,
      start: +at.toFixed(3),
      duration: Math.min(4, Math.max(1, doc.seconds - at)),
      name: `${TRACK_LABELS[track]} clip`,
      kind,
    };
    setClips([...doc.clips, clampClip(clip, doc.seconds)]);
    setSelected(clip.id);
  };

  const sliceAtPlayhead = () => {
    const hit = doc.clips.find((c) => playhead > c.start + 0.05 && playhead < c.start + c.duration - 0.05);
    if (!hit) {
      setNote("Move the playhead over a clip first.");
      return;
    }
    const left: Clip = { ...hit, duration: +(playhead - hit.start).toFixed(3) };
    const right: Clip = { ...hit, id: newId(), start: +playhead.toFixed(3), duration: +(hit.start + hit.duration - playhead).toFixed(3) };
    setClips([...doc.clips.filter((c) => c.id !== hit.id), left, right]);
    setNote("Clip split at the playhead.");
  };

  const onPointerDown = (e: React.PointerEvent, mode: "move" | "left" | "right", clip: Clip) => {
    if (locked.includes(clip.track) || clip.locked) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setSelected(clip.id);
    drag.current = mode === "move" ? { mode, id: clip.id, grabOffset: xToTime(e.clientX) - clip.start } : { mode, id: clip.id };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const t = xToTime(e.clientX);
    const target = snapOn ? snap(t, grid) : +t.toFixed(3);
    setDoc((cur) => ({
      ...cur,
      clips: cur.clips.map((c) => {
        if (c.id !== d.id) return c;
        if (d.mode === "move") return clampClip({ ...c, start: Math.max(0, target - d.grabOffset) }, cur.seconds);
        if (d.mode === "left") {
          const end = c.start + c.duration;
          const start = Math.min(end - 0.2, Math.max(0, target));
          return clampClip({ ...c, start, duration: end - start }, cur.seconds);
        }
        return clampClip({ ...c, duration: Math.max(0.2, target - c.start) }, cur.seconds);
      }),
    }));
  };

  const onPointerUp = () => {
    if (drag.current) {
      setPast((p) => [...p.slice(-49), doc]);
      drag.current = null;
    }
  };

  const sel = doc.clips.find((c) => c.id === selected) ?? null;
  const patch = (p: Partial<Clip>) => sel && setClips(doc.clips.map((c) => (c.id === sel.id ? clampClip({ ...c, ...p }, doc.seconds) : c)));

  const toLayers = () =>
    doc.clips
      .slice()
      .sort((a, b) => a.start - b.start)
      .map((c) => ({
        id: c.id,
        type: (c.kind === "overlay" ? "overlay" : c.kind) as "video" | "image" | "text" | "audio" | "overlay",
        name: c.name,
        visible: !muted.includes(c.track),
        locked: !!c.locked,
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        start: c.start,
        duration: c.duration,
      }));

  const download = (text: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyPreset = (id: string) => {
    const p = VIDEO_PRESETS.find((v) => v.id === id);
    if (!p) return;
    push({ ...doc, ratio: p.ratio, seconds: p.seconds, bpm: p.bpm, genre: p.genre });
    setNote(`${p.name} loaded — ${p.seconds}s at ${p.bpm} BPM.`);
  };

  const width = Math.max(600, doc.seconds * zoom + 40);

  return (
    <div className="aurora-tl" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <div className="aurora-tl-bar">
        <strong>{doc.name}</strong>
        <span className="aurora-tl-time">{fmtTime(playhead)}</span>
        <button onClick={undo} disabled={!past.length} title="Undo (Ctrl+Z)">↶</button>
        <button onClick={redo} disabled={!future.length} title="Redo (Ctrl+Shift+Z)">↷</button>
        <button onClick={sliceAtPlayhead}>Split at playhead</button>
        <button className={snapOn ? "on" : ""} onClick={() => setSnapOn((v) => !v)}>Snap to beat</button>
        <label className="aurora-tl-field">
          BPM
          <input type="number" min={60} max={200} value={doc.bpm} onChange={(e) => setDoc({ ...doc, bpm: Number(e.target.value) || 140 })} />
        </label>
        <label className="aurora-tl-field">
          Length
          <input type="number" min={4} max={600} value={doc.seconds} onChange={(e) => setDoc({ ...doc, seconds: Number(e.target.value) || 30 })} />
        </label>
        <label className="aurora-tl-field">
          Zoom
          <input type="range" min={8} max={90} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </label>
        <select value={doc.ratio} onChange={(e) => setDoc({ ...doc, ratio: e.target.value as TimelineDoc["ratio"] })}>
          <option value="9:16">9:16 Reel</option>
          <option value="16:9">16:9 Cinematic</option>
          <option value="1:1">1:1 Square</option>
        </select>
        <span className="aurora-tl-spacer" />
        <button onClick={() => download(JSON.stringify(buildCapCutDraft(toLayers(), doc.ratio), null, 2), `capcut_draft_${doc.ratio.replace(":", "x")}.json`, "application/json")}>
          Export CapCut draft
        </button>
        <button onClick={() => download(buildEdl(toLayers(), doc.ratio), "shot_list.txt", "text/plain")}>Export shot list</button>
      </div>

      <div className="aurora-tl-presets">
        {VIDEO_PRESETS.map((p) => (
          <button key={p.id} onClick={() => applyPreset(p.id)}>{p.name}</button>
        ))}
      </div>

      <div className="aurora-tl-grid">
        <div className="aurora-tl-heads">
          <div className="aurora-tl-head ruler-space">Tracks</div>
          {TRACKS.map((t) => (
            <div key={t} className={`aurora-tl-head${AUDIO_TRACKS.includes(t as never) ? " audio" : ""}`}>
              <span className="tid">{t}</span>
              <span className="tname">{TRACK_LABELS[t]}</span>
              <span className="tbtns">
                <button className={muted.includes(t) ? "on" : ""} onClick={() => setMuted((m) => (m.includes(t) ? m.filter((x) => x !== t) : [...m, t]))} title="Mute / hide">
                  {AUDIO_TRACKS.includes(t as never) ? "🔈" : "👁"}
                </button>
                <button className={locked.includes(t) ? "on" : ""} onClick={() => setLocked((m) => (m.includes(t) ? m.filter((x) => x !== t) : [...m, t]))} title="Lock">🔒</button>
                <button onClick={() => addClip(t)} title="Add clip at playhead">＋</button>
              </span>
            </div>
          ))}
        </div>

        <div className="aurora-tl-lanes" ref={lane}>
          <div style={{ width }}>
            <div className="aurora-tl-ruler" onPointerDown={(e) => setPlayhead(snapOn ? snap(xToTime(e.clientX), grid) : xToTime(e.clientX))}>
              {Array.from({ length: Math.floor(doc.seconds) + 1 }).map((_, s) =>
                s % (zoom < 18 ? 5 : 1) === 0 ? (
                  <span key={s} className="tick" style={{ left: s * zoom }}>
                    {fmtTime(s)}
                  </span>
                ) : null,
              )}
              {grid.map((t, i) => (
                <span key={`b${i}`} className="beat" style={{ left: t * zoom }} />
              ))}
              {doc.hits.map((h, i) => (
                <span key={`h${i}`} className="hit" style={{ left: h.t * zoom }} title={`${h.kind} → ${h.effect}`} />
              ))}
              <span className="aurora-tl-playhead" style={{ left: playhead * zoom }} />
            </div>

            {TRACKS.map((t) => (
              <div
                key={t}
                className={`aurora-tl-lane${locked.includes(t) ? " locked" : ""}`}
                style={{ height: ROW_H }}
                onDoubleClick={(e) => addClip(t, xToTime(e.clientX))}
              >
                {doc.clips
                  .filter((c) => c.track === t)
                  .map((c) => (
                    <div
                      key={c.id}
                      className={`aurora-tl-clip${selected === c.id ? " sel" : ""}`}
                      style={{ left: c.start * zoom, width: Math.max(14, c.duration * zoom), background: CLIP_COLORS[c.kind] }}
                      onPointerDown={(e) => onPointerDown(e, "move", c)}
                    >
                      <span className="grip left" onPointerDown={(e) => onPointerDown(e, "left", c)} />
                      <span className="lbl">
                        {c.name}
                        {c.effect ? ` · ${c.effect}` : ""}
                      </span>
                      <span className="grip right" onPointerDown={(e) => onPointerDown(e, "right", c)} />
                    </div>
                  ))}
                <span className="aurora-tl-playhead thin" style={{ left: playhead * zoom }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="aurora-tl-foot">
        <div className="aurora-tl-inspector">
          <h4>Selected clip</h4>
          {!sel && <p className="dim">Click a clip to edit it. Double-click empty track space to add one.</p>}
          {sel && (
            <div className="rows">
              <label>
                Name
                <input value={sel.name} onChange={(e) => patch({ name: e.target.value.slice(0, 80) })} />
              </label>
              <label>
                Start
                <input type="number" step={0.1} value={sel.start} onChange={(e) => patch({ start: Number(e.target.value) })} />
              </label>
              <label>
                Length
                <input type="number" step={0.1} value={sel.duration} onChange={(e) => patch({ duration: Number(e.target.value) })} />
              </label>
              <label>
                Effect
                <select value={sel.effect ?? ""} onChange={(e) => patch({ effect: e.target.value })}>
                  <option value="">None</option>
                  {EFFECTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} · {f.beat}</option>
                  ))}
                </select>
              </label>
              <label>
                Look
                <select value={sel.look ?? ""} onChange={(e) => patch({ look: e.target.value })}>
                  <option value="">None</option>
                  {LOOKS.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </label>
              <label className="wide">
                Prompt
                <textarea value={sel.prompt ?? ""} rows={2} onChange={(e) => patch({ prompt: e.target.value.slice(0, 2000) })} />
              </label>
              <div className="wide actions">
                <button onClick={() => patch({ locked: !sel.locked })}>{sel.locked ? "Unlock" : "Lock"}</button>
                <button onClick={() => setClips(doc.clips.filter((c) => c.id !== sel.id))}>Delete clip</button>
              </div>
            </div>
          )}
        </div>
        <div className="aurora-tl-tools">
          <h4>Tools</h4>
          <div className="chips">
            {TOOLS.map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
          {note && <p className="dim">{note}</p>}
        </div>
      </div>
    </div>
  );
}
