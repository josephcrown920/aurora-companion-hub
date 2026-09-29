export type ModelNode = {
  id: string;
  label: string;
  provider: "modelark" | "bagel" | "local";
  category: "chat" | "image" | "video" | "motion" | "assistant" | "code";
  description: string;
};

export const MODEL_REGISTRY: ModelNode[] = [
  {
    id: "dola-seed-2.1-turbo",
    label: "Dola Seed 2.1 Turbo",
    provider: "modelark",
    category: "assistant",
    description: "Creative director and prompt intelligence",
  },
  {
    id: "seedream-5.0",
    label: "Seedream 5.0",
    provider: "modelark",
    category: "image",
    description: "Image generation and visual concept creation",
  },
  {
    id: "seedance-2.1",
    label: "Seedance 2.1",
    provider: "modelark",
    category: "video",
    description: "Video generation and motion-aware creation",
  },
  {
    id: "seedance-2.5",
    label: "Seedance 2.5",
    provider: "modelark",
    category: "motion",
    description: "Motion and camera control pipelines",
  },
  {
    id: "bagel-vision",
    label: "Bagel Vision",
    provider: "bagel",
    category: "video",
    description: "Multimodal backend inference adapter",
  },
  {
    id: "codex-agent",
    label: "Codex Agent",
    provider: "local",
    category: "code",
    description: "Editor automation and timeline orchestration",
  },
];

export const getModelsByCategory = (category: ModelNode["category"]) =>
  MODEL_REGISTRY.filter((model) => model.category === category);

export const findModelById = (id: string) => MODEL_REGISTRY.find((model) => model.id === id);
