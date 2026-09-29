// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Lock,
  LockOpen,
  Music2,
  Plus,
  Redo2,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Video,
  Layers3,
} from "lucide-react";
import { agentEdit, type EditorOp } from "@/features/creative-studio/lib/agent-editor.functions";
import { deleteCapcutDraft, listCapcutDrafts, saveCapcutDraft } from "@/features/creative-studio/lib/capcut-drafts.functions";
import { buildCapCutDraft, buildEdl, type CapCutRatio } from "@/features/creative-studio/lib/capcut-export";
import type { TimelineDoc } from "@/features/creative-studio/lib/timeline-state";

export type LayerItem = {
  id: string;
  type: "video" | "image" | "text" | "audio" | "overlay";
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  scale: number;
  start: number;
  duration: number;
};

type SavedDraft = Awaited<ReturnType<typeof listCapcutDrafts>>[number];
type Preview = { reply: string; next: LayerItem[]; applied: string[]; rejected: string[] };

const TYPES = ["video", "image", "text", "audio", "overlay"] as const;
const ICONS = { video: Video, image: ImageIcon, text: Type, audio: Music2, overlay: Layers3 };

const RATIOS: { id: CapCutRatio; label: string }[] = [
  { id: "9:16", label: "9:16 Reel" },
  { id: "16:9", label: "16:9 Cinematic" },
  { id: "1:1", label: "1:1 Square" },
];

const EXAMPLES = [
  "Cut this into a 15 second teaser",
  "Add a rain overlay at 40% opacity on top",
  "Add a chrome title layer that says OUT THE MUD",
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function newLayer(type: LayerItem["type"], index: number, name?: string): LayerItem {
  return {
    id: crypto.randomUUID(),
    type,
    name: name || `${type[0]!.toUpperCase()}${type.slice(1)} ${index + 1}`,
    visible: true,
    locked: false,
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    start: 0,
    duration: 3,
  };
}

function numPatch(op: EditorOp): Partial<LayerItem> {
  const p: Partial<LayerItem> = {};
  if (typeof op.opacity === "number") p.opacity = clamp(op.opacity, 0, 1);
  if (typeof op.scale === "number") p.scale = clamp(op.scale, 0.1, 4);
  if (typeof op.x === "number") p.x = clamp(op.x, -100, 100);
  if (typeof op.y === "number") p.y = clamp(op.y, -100, 100);
  if (typeof op.start === "number") p.start = clamp(op.start, 0, 600);
  if (typeof op.duration === "number") p.duration = clamp(op.duration, 0.1, 600);
  return p;
}

/** Validates model ops against the current timeline and returns a preview result. */
function validateOps(layers: LayerItem[], ops: EditorOp[]): Omit<Preview, "reply"> {
  let next = [...layers];
  const applied: string[] = [];
  const rejected: string[] = [];
  const find = (id: string | null) => (id ? next.find((l) => l.id === id) : undefined);
  for (const op of ops) {
    if (op.op === "add_layer") {
      const type = TYPES.includes(op.type as LayerItem["type"]) ? (op.type as LayerItem["type"]) : "video";
      const layer = { ...newLayer(type, next.length, op.name ?? undefined), ...numPatch(op) };
      next = [...next, layer];
      applied.push(`+ Add ${type} "${layer.name}" (${layer.start}s–${layer.start + layer.duration}s)`);
      continue;
    }
    const target = find(op.id);
    if (!target) {
      rejected.push(`${op.op}: unknown layer`);
      continue;
    }
    if (target.locked && op.op !== "update_layer") {
      rejected.push(`${op.op}: "${target.name}" is locked`);
      continue;
    }
    if (op.op === "update_layer") {
      const p: Partial<LayerItem> = numPatch(op);
      if (op.name) p.name = op.name.slice(0, 80);
      if (typeof op.visible === "boolean") p.visible = op.visible;
      if (typeof op.locked === "boolean") p.locked = op.locked;
      if (target.locked && Object.keys(p).some((k) => k !== "locked")) {
        rejected.push(`update: "${target.name}" is locked`);
        continue;
      }
      const keys = Object.keys(p);
      if (!keys.length) {
        rejected.push(`update "${target.name}": no changes`);
        continue;
      }
      next = next.map((l) => (l.id === target.id ? { ...l, ...p } : l));
      applied.push(`~ Update "${target.name}": ${keys.map((k) => `${k}=${String(p[k as keyof LayerItem])}`).join(", ")}`);
    } else if (op.op === "remove_layer") {
      next = next.filter((l) => l.id !== target.id);
      applied.push(`- Remove "${target.name}"`);
    } else if (op.op === "reorder_layer") {
      const i = next.findIndex((l) => l.id === target.id);
      const j = i + (op.direction === "down" ? -1 : 1);
      if (j < 0 || j >= next.length) {
        rejected.push(`reorder "${target.name}": already at edge`);
        continue;
      }
      const n = [...next];
      [n[i], n[j]] = [n[j]!, n[i]!];
      next = n;
      applied.push(`↕ Move "${target.name}" ${op.direction === "down" ? "down" : "up"}`);
    }
  }
  return { next, applied, rejected };
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function toLayers(raw: unknown): LayerItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l): l is LayerItem => !!l && typeof l === "object" && "id" in l && "type" in l)
    .map((l) => ({ ...newLayer(l.type, 0), ...l }));
}

export function LayersEditor() {
  const [layers, setLayersRaw] = useState<LayerItem[]>([]);
  const [past, setPast] = useState<LayerItem[][]>([]);
  const [future, setFuture] = useState<LayerItem[][]>([]);
  const lastCommit = useRef<{ key: string; t: number }>({ key: "", t: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [command, setCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [ratio, setRatio] = useState<CapCutRatio>("9:16");
  const [copied, setCopied] = useState(false);
  const [draftName, setDraftName] = useState("Main cut");
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [draftMsg, setDraftMsg] = useState<string | null>(null);

  useEffect(() => {
    const sync = (event: Event) => {
      const doc = (event as CustomEvent<TimelineDoc>).detail;
      if (!doc?.clips) return;
      setLayersRaw((previous) => doc.clips.map((clip) => {
        const old = previous.find((layer) => layer.id === clip.id);
        return { ...newLayer(clip.kind, 0), ...old, id: clip.id, type: clip.kind, name: clip.name, start: clip.start, duration: clip.duration, locked: !!clip.locked };
      }));
    };
    window.addEventListener("aurora:timeline-change", sync);
    return () => window.removeEventListener("aurora:timeline-change", sync);
  }, []);

  const sendToTimeline = (next: LayerItem[]) => window.dispatchEvent(new CustomEvent("aurora:apply-layers", { detail: next }));

  /** Records a history step. Rapid edits with the same key (e.g. slider drags) merge into one step. */
  const commit = (next: LayerItem[], key = "edit") => {
    const now = Date.now();
    const merge = key !== "edit" && lastCommit.current.key === key && now - lastCommit.current.t < 800;
    lastCommit.current = { key, t: now };
    if (!merge) {
      setPast((p) => [...p.slice(-49), layers]);
      setFuture([]);
    }
    setLayersRaw(next);
    sendToTimeline(next);
  };
  const undo = () => {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [layers, ...f]);
    setLayersRaw(prev);
    sendToTimeline(prev);
    lastCommit.current = { key: "", t: 0 };
  };
  const redo = () => {
    const nxt = future[0];
    if (!nxt) return;
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, layers]);
    setLayersRaw(nxt);
    sendToTimeline(nxt);
    lastCommit.current = { key: "", t: 0 };
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const refreshDrafts = async () => {
    try {
      setDrafts(await listCapcutDrafts());
    } catch {
      setDrafts([]);
    }
  };
  useEffect(() => {
    void refreshDrafts();
  }, []);

  const add = (type: LayerItem["type"]) => {
    const layer = newLayer(type, layers.length);
    commit([...layers, layer]);
    setSelected(layer.id);
  };
  const patch = (id: string, p: Partial<LayerItem>, key = "edit") =>
    commit(layers.map((x) => (x.id === id ? { ...x, ...p } : x)), key);
  const remove = (id: string) => {
    commit(layers.filter((x) => x.id !== id));
    if (selected === id) setSelected(null);
  };
  const move = (id: string, d: -1 | 1) => {
    const i = layers.findIndex((x) => x.id === id);
    const j = i + d;
    if (i < 0 || j < 0 || j >= layers.length) return;
    const n = [...layers];
    [n[i], n[j]] = [n[j]!, n[i]!];
    commit(n);
  };
  const active = layers.find((x) => x.id === selected);

  const timeline = useMemo(
    () => layers.reduce((end, l) => Math.max(end, l.start + l.duration), 0),
    [layers],
  );

  const runCommand = async () => {
    const instruction = command.trim();
    if (!instruction || busy) return;
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      const res = await agentEdit({ data: { instruction, layers } });
      const result = validateOps(layers, res.ops);
      if (!result.applied.length) {
        setError(
          result.rejected.length
            ? `No valid edits: ${result.rejected.join("; ")}`
            : res.reply || "The editor didn't suggest any changes.",
        );
      } else {
        setPreview({ reply: res.reply, ...result });
      }
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't run that edit. Sign in and try again.");
    } finally {
      setBusy(false);
    }
  };

  const applyPreview = () => {
    if (!preview) return;
    commit(preview.next);
    setLog((prev) => [`${preview.reply} (${preview.applied.length} edits)`, ...prev].slice(0, 6));
    setCommand("");
    setPreview(null);
  };

  const exportDraft = () => {
    if (!layers.length) return;
    download(`capcut_draft_${ratio.replace(":", "x")}.json`, JSON.stringify(buildCapCutDraft(layers, ratio), null, 2));
  };
  const saveVersion = async () => {
    if (!layers.length) return;
    setDraftMsg(null);
    try {
      const { version } = await saveCapcutDraft({
        data: { name: draftName.trim() || "Untitled cut", ratio, duration: timeline, layers },
      });
      setDraftMsg(`Saved as version ${version}`);
      void refreshDrafts();
    } catch (e) {
      setDraftMsg(e instanceof Error ? e.message : "Sign in to save drafts.");
    }
  };
  const openDraft = (d: SavedDraft) => {
    commit(toLayers(d.layers));
    setRatio((RATIOS.find((r) => r.id === d.ratio)?.id ?? "9:16") as CapCutRatio);
    setDraftName(d.name);
    setSelected(null);
    setDraftMsg(`Opened ${d.name} v${d.version}`);
  };
  const removeDraft = async (id: string) => {
    await deleteCapcutDraft({ data: { id } }).catch(() => null);
    void refreshDrafts();
  };
  const copyEdl = async () => {
    await navigator.clipboard.writeText(buildEdl(layers, ratio));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="aurora-layers-panel">
      <div className="aurora-layers-head">
        <div>
          <strong>AI Video Editor</strong>
          <small>Tell the editor what to change, preview it, then apply it to the timeline.</small>
        </div>
        <div className="aurora-history">
          <button onClick={undo} disabled={!past.length} title="Undo (Ctrl/Cmd+Z)" aria-label="Undo">
            <Undo2 />
          </button>
          <button onClick={redo} disabled={!future.length} title="Redo (Ctrl/Cmd+Shift+Z)" aria-label="Redo">
            <Redo2 />
          </button>
          <span>{layers.length}</span>
        </div>
      </div>

      <div className="aurora-codex-bar">
        <input
          value={command}
          placeholder="e.g. Cut this into a 15s teaser with a chrome title"
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void runCommand();
          }}
        />
        <button onClick={() => void runCommand()} disabled={busy || !command.trim()}>
          {busy ? <span className="aurora-spinner" /> : <Sparkles />}
          {busy ? "Thinking" : "Preview"}
        </button>
      </div>
      <div className="aurora-codex-chips">
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => setCommand(ex)}>
            {ex}
          </button>
        ))}
      </div>
      {error && <div className="aurora-codex-error">{error}</div>}
      {preview && (
        <div className="aurora-codex-preview">
          <strong>{preview.reply}</strong>
          <ul>
            {preview.applied.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
            {preview.rejected.map((r, i) => (
              <li key={`r${i}`} className="rejected">
                Skipped — {r}
              </li>
            ))}
          </ul>
          <div className="aurora-capcut-actions">
            <button onClick={applyPreview}>Apply {preview.applied.length} edits</button>
            <button onClick={() => setPreview(null)}>Discard</button>
          </div>
        </div>
      )}
      {log.length > 0 && (
        <div className="aurora-codex-log">
          {log.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      <div className="aurora-layer-adds">
        {TYPES.map((type) => {
          const Icon = ICONS[type];
          return (
            <button key={type} onClick={() => add(type)}>
              <Icon />
              {type}
            </button>
          );
        })}
      </div>
      <div className="aurora-layer-body">
        <div className="aurora-layer-list">
          {layers.length === 0 ? (
            <div className="aurora-layer-empty">
              <Plus />
              Add video, image, text, audio or overlay layers.
            </div>
          ) : (
            [...layers].reverse().map((layer) => {
              const Icon = ICONS[layer.type];
              return (
                <div
                  key={layer.id}
                  className={`aurora-layer-row ${selected === layer.id ? "active" : ""}`}
                  onClick={() => setSelected(layer.id)}
                >
                  <GripVertical />
                  <Icon />
                  <span>
                    {layer.name} <em className="aurora-layer-time">{layer.start}s–{layer.start + layer.duration}s</em>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      patch(layer.id, { visible: !layer.visible });
                    }}
                  >
                    {layer.visible ? <Eye /> : <EyeOff />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      patch(layer.id, { locked: !layer.locked });
                    }}
                  >
                    {layer.locked ? <Lock /> : <LockOpen />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(layer.id);
                    }}
                  >
                    <Trash2 />
                  </button>
                </div>
              );
            })
          )}
        </div>
        {active && (
          <div className="aurora-layer-inspector">
            <div className="aurora-layer-order">
              <button onClick={() => move(active.id, -1)}>↑</button>
              <button onClick={() => move(active.id, 1)}>↓</button>
            </div>
            <input
              value={active.name}
              disabled={active.locked}
              onChange={(e) => patch(active.id, { name: e.target.value }, `name-${active.id}`)}
            />
            {(
              [
                ["opacity", active.opacity, 0, 1, 0.05],
                ["scale", active.scale, 0.1, 4, 0.05],
                ["x", active.x, -100, 100, 1],
                ["y", active.y, -100, 100, 1],
                ["start", active.start, 0, 120, 0.5],
                ["duration", active.duration, 0.5, 120, 0.5],
              ] as const
            ).map(([key, value, min, max, step]) => (
              <label key={key}>
                {key}
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  disabled={active.locked}
                  onChange={(e) => patch(active.id, { [key]: Number(e.target.value) }, `${key}-${active.id}`)}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="aurora-capcut">
        <div className="aurora-capcut-hd">
          <div>
            <strong>CapCut plugin</strong>
            <small>Timeline length {timeline.toFixed(1)}s · {layers.length} layers</small>
          </div>
          <div className="aurora-capcut-ratios">
            {RATIOS.map((r) => (
              <button key={r.id} className={ratio === r.id ? "active" : ""} onClick={() => setRatio(r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="aurora-capcut-actions">
          <button onClick={exportDraft} disabled={!layers.length}>
            Export CapCut draft
          </button>
          <button onClick={() => void copyEdl()} disabled={!layers.length}>
            {copied ? "Shot list copied" : "Copy shot list"}
          </button>
        </div>
        <div className="aurora-codex-bar">
          <input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Cut name" />
          <button onClick={() => void saveVersion()} disabled={!layers.length}>
            Save version
          </button>
        </div>
        {draftMsg && <small className="aurora-capcut-note">{draftMsg}</small>}
        {drafts.length > 0 && (
          <div className="aurora-draft-list">
            {drafts.map((d) => (
              <div key={d.id} className="aurora-layer-row">
                <span>
                  {d.name} <em className="aurora-layer-time">v{d.version} · {d.ratio} · {d.duration.toFixed(1)}s · {new Date(d.created_at).toLocaleString()}</em>
                </span>
                <button onClick={() => openDraft(d)} title="Open this cut">
                  Open
                </button>
                <button onClick={() => void removeDraft(d.id)} aria-label="Delete version">
                  <Trash2 />
                </button>
              </div>
            ))}
          </div>
        )}
        <small className="aurora-capcut-note">
          Save the draft file into your CapCut drafts folder, then open CapCut — the timeline, text and overlays come in
          ready to edit.
        </small>
      </div>
    </section>
  );
}
