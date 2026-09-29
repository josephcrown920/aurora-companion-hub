import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  createBlankWorkflow,
  loadStoredWorkflows,
  parseComfyWorkflow,
  saveStoredWorkflows,
  validateWorkflow,
  type ComfyWorkflow,
} from "@/features/aurora-canvas/lib/comfy-workflows";

export default function ComfyWorkflowLibrary() {
  const [workflows, setWorkflows] = useState<ComfyWorkflow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [json, setJson] = useState("{}");
  const [name, setName] = useState("New ComfyUI Workflow");
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const stored = loadStoredWorkflows();
    const initial = stored.length ? stored : [createBlankWorkflow()];
    setWorkflows(initial);
    selectWorkflow(initial[0]);
  }, []);

  function selectWorkflow(workflow: ComfyWorkflow) {
    setSelectedId(workflow.id);
    setName(workflow.name);
    setJson(JSON.stringify(workflow.prompt || workflow.ui || {}, null, 2));
  }

  function persist(next: ComfyWorkflow[]) {
    setWorkflows(next);
    saveStoredWorkflows(next);
  }

  function createWorkflow() {
    const workflow = createBlankWorkflow();
    persist([workflow, ...workflows]);
    selectWorkflow(workflow);
    setStatus("New workflow created.");
  }

  function importWorkflow(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workflow = parseComfyWorkflow(JSON.parse(String(reader.result)), file.name.replace(/\.json$/i, ""));
        persist([workflow, ...workflows]);
        selectWorkflow(workflow);
        setStatus("Imported " + file.name + ".");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Import failed.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function saveWorkflow() {
    const current = workflows.find((workflow) => workflow.id === selectedId);
    if (!current) return;
    try {
      const parsed = JSON.parse(json);
      const nextWorkflow = { ...current, name: name.trim() || current.name, prompt: current.format === "api" ? parsed : current.prompt, updatedAt: new Date().toISOString() };
      const next = workflows.map((workflow) => workflow.id === current.id ? nextWorkflow : workflow);
      persist(next);
      selectWorkflow(nextWorkflow);
      setStatus("Saved.");
    } catch (error) {
      setStatus("Invalid JSON: " + (error instanceof Error ? error.message : "unknown error"));
    }
  }

  async function runWorkflow() {
    const current = workflows.find((workflow) => workflow.id === selectedId);
    if (!current) return;
    const validation = validateWorkflow(current);
    if (!validation.ok) { setStatus(validation.errors.join(" ")); return; }
    setRunning(true);
    setStatus("Submitting to ComfyUI...");
    try {
      const response = await fetch("/api/canvas/comfy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow: current.prompt, wait: true }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "ComfyUI run failed.");
      setStatus("Completed · " + data.promptId);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "ComfyUI run failed.");
    } finally {
      setRunning(false);
    }
  }

  const selected = useMemo(() => workflows.find((workflow) => workflow.id === selectedId) || workflows[0], [workflows, selectedId]);

  return (
    <section style={{ marginTop: 22, borderRadius: 16, border: "1px solid rgba(255,255,255,.08)", background: "rgba(7,10,17,.8)", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><div style={{ fontSize: 11, opacity: .65, textTransform: "uppercase", letterSpacing: ".14em" }}>ComfyUI Workflow Library</div><div style={{ fontSize: 24, fontWeight: 800, marginTop: 5 }}>Import · Create · Run</div></div>
        <div style={{ display: "flex", gap: 8 }}><button type="button" onClick={createWorkflow}>New</button><label style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 9, padding: "8px 12px", cursor: "pointer" }}>Import JSON<input hidden type="file" accept=".json,application/json" onChange={importWorkflow} /></label><button type="button" disabled={running} onClick={runWorkflow}>{running ? "Running..." : "Run"}</button></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "240px minmax(0,1fr)", gap: 14, marginTop: 15 }}>
        <aside style={{ display: "grid", gap: 8, alignContent: "start" }}>{workflows.map((workflow) => <button key={workflow.id} type="button" onClick={() => selectWorkflow(workflow)} style={{ textAlign: "left", borderRadius: 10, padding: 11, color: "#edf2ff", border: workflow.id === selected?.id ? "1px solid rgba(124,243,219,.45)" : "1px solid rgba(255,255,255,.06)", background: workflow.id === selected?.id ? "rgba(124,243,219,.1)" : "rgba(255,255,255,.02)" }}><strong>{workflow.name}</strong><div style={{ fontSize: 11, opacity: .6, marginTop: 4 }}>{workflow.format} · {workflow.source}</div></button>)}</aside>
        <div><input value={name} onChange={(event) => setName(event.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10 }} /><textarea value={json} onChange={(event) => setJson(event.target.value)} spellCheck={false} style={{ width: "100%", minHeight: 320, background: "#060911", color: "#dfe7ff", fontFamily: "ui-monospace,monospace", padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,.1)" }} /><div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, gap: 10 }}><button type="button" onClick={saveWorkflow}>Save workflow</button><span style={{ fontSize: 12, opacity: .65 }}>{status}</span></div></div>
      </div>
    </section>
  );
}
