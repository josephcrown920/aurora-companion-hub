// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import "@/features/creative-studio/aurora.css";
import { StudioNav } from "@/features/creative-studio/components/studio/StudioNav";
import {
  NODE_LIBRARY,
  emptyWorkflow,
  exportComfyWorkflow,
  importComfyWorkflow,
  loadWorkflows,
  newNodeId,
  packWorkflow,
  queueOnComfy,
  saveWorkflows,
  topoOrder,
  unpackWorkflow,
  validateWorkflow,
  type AuroraNode,
  type WorkflowSnapshot,
} from "@/features/creative-studio/lib/workflow-engine";
import { loadTimeline, newId, saveTimeline, type Clip, type TrackId } from "@/features/creative-studio/lib/timeline-state";

export const Route = createFileRoute("/video-agent/workflows")({
  head: () => ({
    meta: [
      { title: "Workflows — Aurora Studio" },
      { name: "description", content: "Import ComfyUI workflows, build your own node pipelines and run them in the studio." },
      { property: "og:title", content: "Workflows — Aurora Studio" },
      { property: "og:description", content: "ComfyUI import and export, node editor and a runner that feeds the timeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkflowsPage,
});

function WorkflowsPage() {
  const [list, setList] = useState<WorkflowSnapshot[]>([]);
  const [active, setActive] = useState(0);
  const [comfyUrl, setComfyUrl] = useState("");
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const loaded = loadWorkflows();
    setList(loaded);
  }, []);

  const wf = list[active];
  const update = (next: WorkflowSnapshot) => {
    const copy = list.map((w, i) => (i === active ? next : w));
    setList(copy);
    saveWorkflows(copy);
  };
  const say = (line: string) => setLog((l) => [line, ...l].slice(0, 40));

  const addNode = (kind: string) => {
    if (!wf) return;
    const lib = NODE_LIBRARY.find((n) => n.kind === kind);
    if (!lib) return;
    const node: AuroraNode = { id: newNodeId(), kind: lib.kind, label: lib.label, description: lib.description, params: { ...lib.params }, status: "idle" };
    const last = wf.nodes[wf.nodes.length - 1];
    update({
      ...wf,
      nodes: [...wf.nodes, node],
      edges: last ? [...wf.edges, { id: `e_${last.id}_${node.id}`, from: last.id, to: node.id }] : wf.edges,
    });
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const snapshot = file.name.endsWith(".aurora.json") ? unpackWorkflow(text) : importComfyWorkflow(JSON.parse(text), file.name.replace(/\.json$/, ""));
      const copy = [...list, snapshot];
      setList(copy);
      saveWorkflows(copy);
      setActive(copy.length - 1);
      say(`Imported ${snapshot.nodes.length} steps from ${file.name}.`);
    } catch {
      say("That file could not be read as a ComfyUI or Aurora workflow.");
    }
  };

  const download = (text: string, filename: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const run = async () => {
    if (!wf) return;
    const problems = validateWorkflow(wf);
    if (problems.length) {
      problems.forEach(say);
      return;
    }
    try {
      const order = topoOrder(wf);
      say(`Running ${order.length} steps…`);
      if (comfyUrl.trim()) {
        const res = await queueOnComfy(comfyUrl.trim(), exportComfyWorkflow(wf));
        say(`Queued on your ComfyUI server (job ${res.prompt_id}).`);
      }
      const exports = order.filter((n) => n.kind === "export");
      const doc = loadTimeline();
      const prompt = order.find((n) => n.kind === "text")?.params["prompt"];
      const clips: Clip[] = exports.map((n, i) => ({
        id: newId(),
        track: (String(n.params["track"] ?? "V1") as TrackId) ?? "V1",
        start: doc.clips.length ? Math.max(...doc.clips.map((c) => c.start + c.duration)) + i * 4 : i * 4,
        duration: 4,
        name: wf.name,
        kind: "video",
        ...(typeof prompt === "string" ? { prompt } : {}),
      }));
      saveTimeline({ ...doc, clips: [...doc.clips, ...clips] });
      say(exports.length ? `Added ${exports.length} clip(s) to the timeline.` : "Finished. Add an Export step to send results to the timeline.");
    } catch (e) {
      say((e as Error).message);
    }
  };

  return (
    <div className="aurora-body aurora-page">
      <StudioNav />
      <div className="aurora-wrap">
        <h1 className="aurora-page-title">Workflows</h1>
        <p className="aurora-page-sub">Bring in ComfyUI workflows or build your own chain of steps and run it here.</p>

        <div className="aurora-panel">
          <div className="aurora-row wrap">
            {list.map((w, i) => (
              <button key={w.name + i} className={`aurora-btn${i === active ? " primary" : ""}`} onClick={() => setActive(i)}>
                {w.name}
              </button>
            ))}
            <button
              className="aurora-btn"
              onClick={() => {
                const copy = [...list, emptyWorkflow(`Workflow ${list.length + 1}`)];
                setList(copy);
                saveWorkflows(copy);
                setActive(copy.length - 1);
              }}
            >
              ＋ New
            </button>
            <label className="aurora-btn file">
              Import JSON
              <input type="file" accept=".json" onChange={(e) => void importFile(e.target.files?.[0])} />
            </label>
          </div>
        </div>

        {wf && (
          <div className="aurora-panel">
            <div className="aurora-row">
              <input className="aurora-input" value={wf.name} onChange={(e) => update({ ...wf, name: e.target.value.slice(0, 80) })} />
              <input className="aurora-input" placeholder="ComfyUI server URL (optional)" value={comfyUrl} onChange={(e) => setComfyUrl(e.target.value)} />
              <button className="aurora-btn primary" onClick={() => void run()}>Run workflow</button>
              <button className="aurora-btn" onClick={() => download(packWorkflow(wf), `${wf.name}.aurora.json`)}>Save file</button>
              <button className="aurora-btn" onClick={() => download(JSON.stringify(exportComfyWorkflow(wf), null, 2), `${wf.name}.comfy.json`)}>Export for ComfyUI</button>
            </div>

            <div className="aurora-row wrap aurora-nodelib">
              {NODE_LIBRARY.map((n) => (
                <button key={n.kind} className="aurora-chip-btn" onClick={() => addNode(n.kind)}>
                  ＋ {n.label}
                </button>
              ))}
            </div>

            <div className="aurora-nodes">
              {wf.nodes.map((n, i) => (
                <div key={n.id} className="aurora-node">
                  <header>
                    <strong>
                      {i + 1}. {n.label}
                    </strong>
                    <button
                      onClick={() =>
                        update({ ...wf, nodes: wf.nodes.filter((x) => x.id !== n.id), edges: wf.edges.filter((e) => e.from !== n.id && e.to !== n.id) })
                      }
                    >
                      ✕
                    </button>
                  </header>
                  <p>{n.description}</p>
                  {Object.entries(n.params).map(([k, v]) => (
                    <label key={k}>
                      {k}
                      <input
                        value={String(v)}
                        onChange={(e) =>
                          update({
                            ...wf,
                            nodes: wf.nodes.map((x) => (x.id === n.id ? { ...x, params: { ...x.params, [k]: e.target.value } } : x)),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              ))}
              {!wf.nodes.length && <p className="aurora-note">Add a step above to start this workflow.</p>}
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="aurora-panel">
            <h3>Run log</h3>
            {log.map((l, i) => (
              <p key={i} className="aurora-note">{l}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
