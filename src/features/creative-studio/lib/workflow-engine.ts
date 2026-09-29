// @ts-nocheck
// Aurora Workflow Engine (foundation v0.4) — provider-neutral graph, runtime and ComfyUI bridge.
// Canvas -> Graph contract -> Runtime -> Provider adapter.

export type NodeKind =
  | "input"
  | "text"
  | "image"
  | "video"
  | "motion"
  | "style"
  | "remove-bg"
  | "enhance"
  | "upscale"
  | "fisheye"
  | "export"
  | "super";

export type AuroraNode = {
  id: string;
  kind: NodeKind;
  label: string;
  description: string;
  params: Record<string, string | number | boolean>;
  status?: "idle" | "running" | "complete" | "failed";
  output?: string;
};

export type AuroraEdge = { id: string; from: string; to: string };

export type WorkflowSnapshot = {
  name: string;
  version: string;
  nodes: AuroraNode[];
  edges: AuroraEdge[];
};

export const NODE_LIBRARY: { kind: NodeKind; label: string; description: string; params: Record<string, string | number | boolean> }[] = [
  { kind: "input", label: "Input", description: "Reference image or clip", params: { source: "" } },
  { kind: "text", label: "Prompt", description: "Text prompt for the model", params: { prompt: "" } },
  { kind: "image", label: "Image model", description: "Generate a still", params: { model: "seedream-5.0", aspect: "9:16" } },
  { kind: "video", label: "Video model", description: "Generate a clip", params: { model: "seedance-2.5", seconds: 5 } },
  { kind: "motion", label: "Motion", description: "Camera move and energy", params: { camera: "dolly-in", energy: "medium" } },
  { kind: "style", label: "Style / LUT", description: "Apply an Aurora look", params: { look: "mud" } },
  { kind: "remove-bg", label: "Remove background", description: "Cut the subject out", params: {} },
  { kind: "enhance", label: "Enhance", description: "Sharpen and denoise", params: { strength: 50 } },
  { kind: "upscale", label: "Upscale", description: "Raise resolution", params: { factor: 2 } },
  { kind: "fisheye", label: "Fisheye", description: "Krea fisheye lens node", params: { strength: 60 } },
  { kind: "export", label: "Export", description: "Send to the timeline", params: { track: "V1" } },
];

export function newNodeId(): string {
  return `n_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyWorkflow(name = "Untitled workflow"): WorkflowSnapshot {
  return { name, version: "aurora-0.4", nodes: [], edges: [] };
}

/** Topological order; throws when the graph has a cycle. */
export function topoOrder(snapshot: WorkflowSnapshot): AuroraNode[] {
  const indeg = new Map<string, number>();
  snapshot.nodes.forEach((n) => indeg.set(n.id, 0));
  snapshot.edges.forEach((e) => indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1));
  const queue = snapshot.nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0);
  const out: AuroraNode[] = [];
  while (queue.length) {
    const n = queue.shift()!;
    out.push(n);
    for (const e of snapshot.edges.filter((x) => x.from === n.id)) {
      const left = (indeg.get(e.to) ?? 1) - 1;
      indeg.set(e.to, left);
      if (left === 0) {
        const next = snapshot.nodes.find((x) => x.id === e.to);
        if (next) queue.push(next);
      }
    }
  }
  if (out.length !== snapshot.nodes.length) throw new Error("This workflow has a loop in it — remove a connection.");
  return out;
}

export function validateWorkflow(snapshot: WorkflowSnapshot): string[] {
  const problems: string[] = [];
  if (!snapshot.nodes.length) problems.push("Add at least one step.");
  const hasPrompt = snapshot.nodes.some((n) => n.kind === "text" && String(n.params["prompt"] ?? "").trim());
  const hasModel = snapshot.nodes.some((n) => n.kind === "image" || n.kind === "video");
  if (hasModel && !hasPrompt) problems.push("A model step needs a prompt step connected to it.");
  try {
    topoOrder(snapshot);
  } catch (e) {
    problems.push((e as Error).message);
  }
  return problems;
}

/* ---------------- ComfyUI bridge ---------------- */

export type ComfyWorkflow = { prompt: Record<string, unknown>; extra_data?: Record<string, unknown> };

const COMFY_MAP: { match: RegExp; kind: NodeKind; label: string }[] = [
  { match: /CLIPTextEncode|Text/i, kind: "text", label: "Prompt" },
  { match: /LoadImage|ImageLoad/i, kind: "input", label: "Input" },
  { match: /Upscale|ESRGAN/i, kind: "upscale", label: "Upscale" },
  { match: /AnimateDiff|VideoCombine|SVD/i, kind: "video", label: "Video model" },
  { match: /ControlNet|IPAdapter|LoraLoader/i, kind: "style", label: "Style / LUT" },
  { match: /RemoveBackground|RemBG/i, kind: "remove-bg", label: "Remove background" },
  { match: /SaveImage|PreviewImage|Save/i, kind: "export", label: "Export" },
  { match: /KSampler|Sampler|Checkpoint/i, kind: "image", label: "Image model" },
];

/** Translate a ComfyUI API-format workflow (`{ "1": {class_type, inputs} }`) into Aurora nodes. */
export function importComfyWorkflow(json: unknown, name = "Imported ComfyUI workflow"): WorkflowSnapshot {
  const root = (json as { prompt?: Record<string, unknown> })?.prompt ?? (json as Record<string, unknown>);
  const entries = Object.entries(root ?? {}).filter(([, v]) => v && typeof v === "object");
  const nodes: AuroraNode[] = [];
  const edges: AuroraEdge[] = [];
  const idMap = new Map<string, string>();

  for (const [key, value] of entries) {
    const v = value as { class_type?: string; inputs?: Record<string, unknown> };
    const cls = String(v.class_type ?? "Node");
    const hit = COMFY_MAP.find((m) => m.match.test(cls));
    const id = newNodeId();
    idMap.set(key, id);
    const params: Record<string, string | number | boolean> = { comfy_class: cls };
    for (const [pk, pv] of Object.entries(v.inputs ?? {})) {
      if (typeof pv === "string" || typeof pv === "number" || typeof pv === "boolean") params[pk] = pv;
    }
    nodes.push({
      id,
      kind: hit?.kind ?? "enhance",
      label: hit?.label ?? cls,
      description: `ComfyUI ${cls}`,
      params,
      status: "idle",
    });
  }

  for (const [key, value] of entries) {
    const v = value as { inputs?: Record<string, unknown> };
    for (const pv of Object.values(v.inputs ?? {})) {
      if (Array.isArray(pv) && typeof pv[0] === "string") {
        const from = idMap.get(String(pv[0]));
        const to = idMap.get(key);
        if (from && to && from !== to) edges.push({ id: `e_${from}_${to}`, from, to });
      }
    }
  }

  return { name, version: "comfyui-import", nodes, edges };
}

export function exportComfyWorkflow(snapshot: WorkflowSnapshot): ComfyWorkflow {
  const prompt: Record<string, unknown> = {};
  snapshot.nodes.forEach((n, i) => {
    prompt[String(i + 1)] = {
      class_type: String(n.params["comfy_class"] ?? auroraToComfyClass(n.kind)),
      inputs: Object.fromEntries(Object.entries(n.params).filter(([k]) => k !== "comfy_class")),
      _meta: { title: n.label },
    };
  });
  return { prompt, extra_data: { source: "aurora-workflow-engine", name: snapshot.name, version: snapshot.version } };
}

function auroraToComfyClass(kind: NodeKind): string {
  switch (kind) {
    case "text":
      return "CLIPTextEncode";
    case "input":
      return "LoadImage";
    case "image":
      return "KSampler";
    case "video":
      return "AnimateDiffCombine";
    case "upscale":
      return "ImageUpscaleWithModel";
    case "export":
      return "SaveImage";
    default:
      return "AuroraNode";
  }
}

/** Queue on a self-hosted ComfyUI server (browser fetch, user supplies the URL). */
export async function queueOnComfy(baseUrl: string, workflow: ComfyWorkflow): Promise<{ prompt_id: string }> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workflow),
  });
  if (!res.ok) throw new Error(`ComfyUI refused the job (${res.status}). Check the server address.`);
  return (await res.json()) as { prompt_id: string };
}

/* ---------------- packaging ---------------- */

export function packWorkflow(snapshot: WorkflowSnapshot): string {
  return JSON.stringify({ format: "aurora.workflow", version: "0.4", workflow: snapshot }, null, 2);
}

export function unpackWorkflow(text: string): WorkflowSnapshot {
  const parsed = JSON.parse(text) as { format?: string; workflow?: WorkflowSnapshot };
  if (parsed.format === "aurora.workflow" && parsed.workflow) return parsed.workflow;
  return importComfyWorkflow(parsed);
}

export const STARTER_WORKFLOWS: WorkflowSnapshot[] = [
  {
    name: "Out The Mud chrome upscale",
    version: "aurora-0.4",
    nodes: [
      { id: "s1", kind: "input", label: "Input", description: "Reference frame", params: { source: "" } },
      { id: "s2", kind: "style", label: "Style / LUT", description: "Chrome 3D look", params: { look: "chrome" } },
      { id: "s3", kind: "upscale", label: "Upscale", description: "4K finish", params: { factor: 4 } },
      { id: "s4", kind: "export", label: "Export", description: "Send to V1", params: { track: "V1" } },
    ],
    edges: [
      { id: "e1", from: "s1", to: "s2" },
      { id: "e2", from: "s2", to: "s3" },
      { id: "e3", from: "s3", to: "s4" },
    ],
  },
  {
    name: "Drill rain shot generator",
    version: "aurora-0.4",
    nodes: [
      { id: "d1", kind: "text", label: "Prompt", description: "Shot description", params: { prompt: "Port Harcourt night, rain on chrome, low angle hero shot" } },
      { id: "d2", kind: "video", label: "Video model", description: "Seedance clip", params: { model: "seedance-2.5", seconds: 5 } },
      { id: "d3", kind: "motion", label: "Motion", description: "Slow dolly", params: { camera: "dolly-in", energy: "high" } },
      { id: "d4", kind: "style", label: "Style / LUT", description: "PH Rain look", params: { look: "rain" } },
      { id: "d5", kind: "export", label: "Export", description: "Send to V2", params: { track: "V2" } },
    ],
    edges: [
      { id: "e1", from: "d1", to: "d2" },
      { id: "e2", from: "d2", to: "d3" },
      { id: "e3", from: "d3", to: "d4" },
      { id: "e4", from: "d4", to: "d5" },
    ],
  },
  {
    name: "Fisheye performance pass",
    version: "aurora-0.4",
    nodes: [
      { id: "f1", kind: "input", label: "Input", description: "Performance frame", params: { source: "" } },
      { id: "f2", kind: "fisheye", label: "Fisheye", description: "Krea fisheye lens", params: { strength: 75 } },
      { id: "f3", kind: "enhance", label: "Enhance", description: "Sharpen", params: { strength: 60 } },
      { id: "f4", kind: "export", label: "Export", description: "Send to V2", params: { track: "V2" } },
    ],
    edges: [
      { id: "e1", from: "f1", to: "f2" },
      { id: "e2", from: "f2", to: "f3" },
      { id: "e3", from: "f3", to: "f4" },
    ],
  },
];

export const WORKFLOW_KEY = "aurora_workflows_v1";

export function loadWorkflows(): WorkflowSnapshot[] {
  if (typeof window === "undefined") return STARTER_WORKFLOWS;
  try {
    const raw = window.localStorage.getItem(WORKFLOW_KEY);
    if (!raw) return STARTER_WORKFLOWS;
    const parsed = JSON.parse(raw) as WorkflowSnapshot[];
    return Array.isArray(parsed) && parsed.length ? parsed : STARTER_WORKFLOWS;
  } catch {
    return STARTER_WORKFLOWS;
  }
}

export function saveWorkflows(list: WorkflowSnapshot[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WORKFLOW_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
