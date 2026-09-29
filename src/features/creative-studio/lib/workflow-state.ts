export type WorkflowStatus = "idle" | "queued" | "running" | "review" | "done";

export type StudioRuntimeState = {
  selectedModel: string;
  workflowStatus: WorkflowStatus;
  currentBrief: string;
  currentStep: string;
};

export const defaultStudioRuntimeState: StudioRuntimeState = {
  selectedModel: "seedance-2.1",
  workflowStatus: "idle",
  currentBrief: "",
  currentStep: "brief_received",
};
