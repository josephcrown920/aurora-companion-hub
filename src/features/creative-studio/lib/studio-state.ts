export type PlaybackMode = "preview" | "generate" | "edit";

export type ProjectRequest = {
  id: string;
  brief: string;
  mode: "image" | "video";
  modelId: string;
  aspect: "1:1" | "16:9" | "9:16";
  durationSeconds?: number;
  createdAt: string;
  status: "draft" | "queued" | "running" | "done" | "error";
};

export const defaultProjectRequest: ProjectRequest = {
  id: "project-1",
  brief: "Create a cinematic tunnel walk in rain with chrome chains, reflective surfaces, and a dramatic editorial finish.",
  mode: "video",
  modelId: "seedance-2.1",
  aspect: "16:9",
  durationSeconds: 12,
  createdAt: new Date().toISOString(),
  status: "draft",
};

export type StudioState = {
  activeWorkspace: string;
  currentProject: ProjectRequest;
  playbackMode: PlaybackMode;
  memory: string[];
  selectedModelId: string;
};

export const defaultStudioState: StudioState = {
  activeWorkspace: "assistant",
  currentProject: defaultProjectRequest,
  playbackMode: "preview",
  memory: [
    "Prefer cinematic, high-contrast, realistic lighting.",
    "Keep UI elegant and dark with subtle glass textures.",
  ],
  selectedModelId: "dola-seed-2.1-turbo",
};
