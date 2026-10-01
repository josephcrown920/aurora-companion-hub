import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, Send, Volume2, VolumeX, Check, X } from "lucide-react";
import { loadTimeline, type TimelineDoc } from "@/features/creative-studio/lib/timeline-state";
import { directorTurn, getStudioProject, saveStudioProject, type DirectorOp, type StudioProject } from "@/features/creative-studio/lib/studio-director.functions";

type Msg = { role: "user" | "director"; text: string };

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.02;
  window.speechSynthesis.speak(u);
}

function applyOps(doc: TimelineDoc, ops: DirectorOp[]): TimelineDoc {
  let clips = [...doc.clips];
  for (const op of ops) {
    if (op.op === "remove_clip") clips = clips.filter((c) => c.id !== op.id);
    else clips = clips.map((c) => (c.id === op.id ? {
      ...c,
      ...(op.start !== undefined ? { start: op.start } : {}),
      ...(op.duration !== undefined ? { duration: op.duration } : {}),
      ...(op.track ? { track: op.track as typeof c.track } : {}),
      ...(op.name ? { name: op.name } : {}),
      ...(op.effect ? { effect: op.effect } : {}),
      ...(op.look ? { look: op.look } : {}),
    } : c));
  }
  const end = Math.max(doc.seconds, ...clips.map((c) => Math.ceil(c.start + c.duration)));
  return { ...doc, seconds: end, clips };
}

export function StudioDirectorPanel() {
  const fetchProject = useServerFn(getStudioProject);
  const save = useServerFn(saveStudioProject);
  const turn = useServerFn(directorTurn);
  const [project, setProject] = useState<StudioProject | null>(null);
  const [error, setError] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [voice, setVoice] = useState(true);
  const [listening, setListening] = useState(false);
  const [pending, setPending] = useState<DirectorOp[]>([]);
  const [newNote, setNewNote] = useState("");
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    fetchProject().then((p) => {
      setProject(p);
      setMsgs((p.activity || []).slice(-8).map((a) => ({ role: a.role === "user" ? "user" : "director", text: a.text })));
    }).catch((e) => setError(e instanceof Error && /unauth/i.test(e.message) ? "Sign in to use the director." : "Couldn't load your project."));
  }, [fetchProject]);

  const persist = (next: StudioProject) => {
    setProject(next);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void save({ data: { id: next.id, title: next.title || "Untitled project", brief: next.brief, context_notes: next.context_notes } });
    }, 700);
  };

  const send = async (message: string) => {
    if (!project || !message.trim() || busy) return;
    setText("");
    setMsgs((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    try {
      const doc = loadTimeline();
      const res = await turn({ data: { projectId: project.id, message, seconds: doc.seconds, clips: doc.clips.map((c) => ({ id: c.id, track: c.track, start: c.start, duration: c.duration, name: c.name, kind: c.kind, ...(c.effect ? { effect: c.effect } : {}), ...(c.look ? { look: c.look } : {}) })) } });
      setMsgs((m) => [...m, { role: "director", text: res.reply }]);
      setProject((p) => (p ? { ...p, brief: res.brief, context_notes: res.context_notes } : p));
      setPending(res.ops);
      if (voice) speak(res.reply);
    } catch (e) {
      setMsgs((m) => [...m, { role: "director", text: e instanceof Error ? e.message : "Director unavailable." }]);
    } finally {
      setBusy(false);
    }
  };

  const listen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Voice input isn't supported in this browser."); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.onresult = (ev: any) => void send(ev.results[0][0].transcript);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const approve = () => {
    window.dispatchEvent(new CustomEvent("aurora:apply-doc", { detail: applyOps(loadTimeline(), pending) }));
    setPending([]);
  };

  if (error && !project) return <section className="aurora-glass aurora-director-panel"><p className="aurora-director-muted">{error}</p></section>;
  if (!project) return <section className="aurora-glass aurora-director-panel"><Loader2 className="size-4 animate-spin" /></section>;

  return (
    <section className="aurora-glass aurora-director-panel" aria-label="DolaSeed director">
      <header className="aurora-director-head">
        <div><b>DolaSeed Director</b><small>Studio + editor · remembers this project</small></div>
        <button type="button" className="aurora-glass-btn" onClick={() => { setVoice((v) => !v); window.speechSynthesis?.cancel(); }} aria-label={voice ? "Mute voice replies" : "Enable voice replies"}>{voice ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}</button>
      </header>
      <input className="aurora-glass-input" value={project.title} onChange={(e) => persist({ ...project, title: e.target.value })} aria-label="Project title" />
      <label className="aurora-director-label">Creative brief</label>
      <textarea className="aurora-glass-input" rows={4} value={project.brief} placeholder="Song, performer, look, story… the director keeps this updated." onChange={(e) => persist({ ...project, brief: e.target.value })} />
      <label className="aurora-director-label">Project memory ({project.context_notes.length})</label>
      <ul className="aurora-director-memory">
        {project.context_notes.map((n, i) => (
          <li key={`${i}-${n}`}><span>{n}</span><button type="button" aria-label="Forget note" onClick={() => persist({ ...project, context_notes: project.context_notes.filter((_, j) => j !== i) })}><X className="size-3" /></button></li>
        ))}
      </ul>
      <div className="aurora-director-row">
        <input className="aurora-glass-input" value={newNote} placeholder="Add a fact to remember" onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newNote.trim()) { persist({ ...project, context_notes: [...project.context_notes, newNote.trim()] }); setNewNote(""); } }} />
      </div>
      <div className="aurora-director-chat">
        {msgs.length === 0 && <p className="aurora-director-muted">Tell me about the video — I'll fill the brief and edit the timeline with you.</p>}
        {msgs.map((m, i) => <div key={i} className={`aurora-director-msg ${m.role}`}>{m.text}</div>)}
        {busy && <Loader2 className="size-4 animate-spin" />}
      </div>
      {pending.length > 0 && (
        <div className="aurora-director-pending">
          <b>{pending.length} timeline change{pending.length > 1 ? "s" : ""} proposed</b>
          <ul>{pending.map((o, i) => <li key={i}>{o.op === "remove_clip" ? `Remove ${o.id}` : `Update ${o.id}: ${Object.entries(o).filter(([k]) => !["op", "id"].includes(k)).map(([k, v]) => `${k} ${v}`).join(", ")}`}</li>)}</ul>
          <div className="aurora-director-row">
            <button type="button" className="aurora-glass-btn primary" onClick={approve}><Check className="size-4" /> Apply (undoable)</button>
            <button type="button" className="aurora-glass-btn" onClick={() => setPending([])}>Dismiss</button>
          </div>
        </div>
      )}
      <div className="aurora-director-row">
        <button type="button" className={`aurora-glass-btn${listening ? " primary" : ""}`} onClick={listen} aria-label="Speak to the director"><Mic className="size-4" /></button>
        <input className="aurora-glass-input" value={text} placeholder="Direct the edit…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send(text)} />
        <button type="button" className="aurora-glass-btn primary" disabled={busy} onClick={() => void send(text)} aria-label="Send"><Send className="size-4" /></button>
      </div>
    </section>
  );
}
