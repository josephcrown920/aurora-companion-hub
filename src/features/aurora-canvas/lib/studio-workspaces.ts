export type WorkspaceId =
  | "assistant"
  | "image"
  | "video"
  | "editor"
  | "codex"
  | "orchestrator"
  | "memory"
  | "settings";

export type StudioWorkspace = {
  id: WorkspaceId;
  label: string;
  icon: string;
  description: string;
  active: boolean;
};

export const WORKSPACES: StudioWorkspace[] = [
  { id: "assistant", label: "AI Assistant", icon: "◉", description: "Creative director and prompt flow", active: true },
  { id: "image", label: "Image Gen", icon: "◌", description: "Seedream generation studio", active: false },
  { id: "video", label: "Video Editor", icon: "◍", description: "Editor, clips, motion and preview", active: false },
  { id: "editor", label: "Codex", icon: "▣", description: "Automation and editor actions", active: false },
  { id: "orchestrator", label: "Agent Orchestrator", icon: "◇", description: "Workflow routing and memory", active: false },
  { id: "memory", label: "Long Memory", icon: "◔", description: "Saved context and project memory", active: false },
  { id: "settings", label: "Settings", icon: "⚙", description: "Model and provider config", active: false },
];

export const defaultWorkspace: WorkspaceId = "assistant";
