export type AgentRole =
  | "director"
  | "vision"
  | "storyboard"
  | "character-continuity"
  | "world-continuity"
  | "workflow"
  | "editor"
  | "audio"
  | "qa";

export type AgentTask = {
  role: AgentRole;
  objective: string;
  inputs: string[];
  output: string;
  preferredModel: string;
};

export const AGENT_ROLES: Record<AgentRole, { label: string; model: string; focus: string }> = {
  director: { label: "Creative Director", model: "dola-seed-2-1-turbo-260628", focus: "brief interpretation, creative decisions, capability routing" },
  vision: { label: "Vision Analyst", model: "deepseek-v4-1-flash-260910", focus: "image/video understanding, evidence extraction, scene analysis" },
  storyboard: { label: "Storyboard Artist", model: "dola-seed-2-1-turbo-260628", focus: "shots, framing, beats, transitions and generation prompts" },
  "character-continuity": { label: "Character Continuity", model: "glm-5-3-flash-260828", focus: "identity, wardrobe, blocking, gaze and interaction locks" },
  "world-continuity": { label: "World Continuity", model: "glm-5-3-flash-260828", focus: "location, props, time, lighting and visual bible" },
  workflow: { label: "ComfyUI Workflow Agent", model: "dola-seed-2-1-turbo-260628", focus: "select, parameterize and execute saved ComfyUI graphs" },
  editor: { label: "Timeline Editor", model: "dola-seed-2-1-turbo-260628", focus: "layers, trims, splits, reorder, captions and regeneration" },
  audio: { label: "Audio Editor", model: "glm-5-3-flash-260828", focus: "dialogue, music, SFX, sync and ducking" },
  qa: { label: "QA Inspector", model: "deepseek-v4-1-flash-260910", focus: "continuity checks, failed-shot detection and targeted repairs" },
};

export function buildVideoAgentGraph(instruction: string): AgentTask[] {
  return [
    { role: "director", objective: "Understand the user's intent and define acceptance criteria.", inputs: ["brief", "project memory"], output: "creative brief + acceptance criteria", preferredModel: AGENT_ROLES.director.model },
    { role: "vision", objective: "Analyze supplied visual evidence before generation or editing.", inputs: ["images", "videos", "documents"], output: "visual evidence map", preferredModel: AGENT_ROLES.vision.model },
    { role: "character-continuity", objective: "Build stable character identities and blocking for multi-character scenes.", inputs: ["visual evidence map", "creative brief"], output: "character bible + blocking locks", preferredModel: AGENT_ROLES["character-continuity"].model },
    { role: "world-continuity", objective: "Lock world, props, lighting, wardrobe and camera language.", inputs: ["visual evidence map", "character bible"], output: "world bible", preferredModel: AGENT_ROLES["world-continuity"].model },
    { role: "storyboard", objective: "Turn the plan into shot-level generation and edit instructions.", inputs: ["brief", "character bible", "world bible"], output: "storyboard + shot prompts", preferredModel: AGENT_ROLES.storyboard.model },
    { role: "workflow", objective: "Choose the best saved ComfyUI graph and define the parameters to execute it.", inputs: ["storyboard", "character/world bibles", "workflow library"], output: "workflow execution plan", preferredModel: AGENT_ROLES.workflow.model },
    { role: "editor", objective: "Translate approved shot plans into a layer-aware reversible timeline plan.", inputs: ["storyboard", "workflow execution plan", "current timeline", "user revision"], output: "timeline edit plan", preferredModel: AGENT_ROLES.editor.model },
    { role: "audio", objective: "Plan dialogue, narration, music and SFX as first-class layers.", inputs: ["storyboard", "timeline edit plan"], output: "audio layer plan", preferredModel: AGENT_ROLES.audio.model },
    { role: "qa", objective: "Inspect the assembled result and request only targeted repairs.", inputs: ["all prior outputs", "render preview"], output: "QA report + repair list", preferredModel: AGENT_ROLES.qa.model },
  ];
}
