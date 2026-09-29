export type Provider = "ark" | "zenmux";

export interface ModelOption {
  id: string;
  label: string;
  vendor: string;
  provider: Provider;
  note?: string;
}

export const IMAGE_MODELS: ModelOption[] = [
  { id: "seedream-5-0-260128", label: "Seedream 5.0", vendor: "ByteDance", provider: "ark" },
  {
    id: "dola-seedream-5-0-pro-260628",
    label: "Dola Seedream 5.0 Pro",
    vendor: "ByteDance",
    provider: "ark",
  },
  { id: "seedream-4-5-251128", label: "Seedream 4.5", vendor: "ByteDance", provider: "ark" },
  { id: "seedream-4-0-250828", label: "Seedream 4.0", vendor: "ByteDance", provider: "ark" },
  {
    id: "seedream-4-0-20260415",
    label: "Seedream 4.0 (Apr 26)",
    vendor: "ByteDance",
    provider: "ark",
  },
  {
    id: "seedream-3-0-t2i-250415",
    label: "Seedream 3.0",
    vendor: "ByteDance",
    provider: "ark",
    note: "Retiring",
  },
  // ---- ZenMux ----
  {
    id: "openai/gpt-image-2.5-sunburst",
    label: "GPT Image 2.5 Sunburst",
    vendor: "OpenAI",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "openai/gpt-image-2.5-flare",
    label: "GPT Image 2.5 Flare",
    vendor: "OpenAI",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "openai/gpt-image-2",
    label: "GPT Image 2",
    vendor: "OpenAI",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "openai/gpt-image-1.5",
    label: "GPT Image 1.5",
    vendor: "OpenAI",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "meta/muse-image-1.0",
    label: "Muse Image 1.0",
    vendor: "Meta",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "x-ai/grok-imagine-image-2.0",
    label: "Grok Imagine Image 2.0",
    vendor: "xAI",
    provider: "zenmux",
    note: "ZenMux",
  },
];

export const VIDEO_MODELS: ModelOption[] = [
  {
    id: "dreamina-seedance-2-5-260628",
    label: "Seedance 2.5",
    vendor: "Dreamina",
    provider: "ark",
  },
  {
    id: "dreamina-seedance-2-0-260128",
    label: "Seedance 2.0",
    vendor: "Dreamina",
    provider: "ark",
  },
  {
    id: "dreamina-seedance-2-0-fast-260128",
    label: "Seedance 2.0 Fast",
    vendor: "Dreamina",
    provider: "ark",
  },
  {
    id: "dreamina-seedance-2-0-mini-260615",
    label: "Seedance 2.0 Mini",
    vendor: "Dreamina",
    provider: "ark",
  },
  {
    id: "seedance-1-5-pro-251215",
    label: "Seedance 1.5 Pro",
    vendor: "ByteDance",
    provider: "ark",
    note: "Retiring",
  },
  {
    id: "seedance-1-0-pro-250528",
    label: "Seedance 1.0 Pro",
    vendor: "ByteDance",
    provider: "ark",
  },
  {
    id: "seedance-1-0-pro-fast-251015",
    label: "Seedance 1.0 Pro Fast",
    vendor: "ByteDance",
    provider: "ark",
  },
  {
    id: "seedance-1-0-lite-t2v-250428",
    label: "Seedance 1.0 Lite (text)",
    vendor: "ByteDance",
    provider: "ark",
    note: "Retiring",
  },
  {
    id: "seedance-1-0-lite-i2v-250428",
    label: "Seedance 1.0 Lite (image)",
    vendor: "ByteDance",
    provider: "ark",
    note: "Needs reference",
  },
  {
    id: "omnihuman-1-5-251015",
    label: "OmniHuman 1.5",
    vendor: "ByteDance",
    provider: "ark",
    note: "Needs activation",
  },
  // ---- ZenMux ----
  {
    id: "klingai/kling-3.0-omni",
    label: "Kling 3.0 Omni",
    vendor: "KlingAI",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "klingai/kling-3.0",
    label: "Kling 3.0",
    vendor: "KlingAI",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "klingai/kling-3.0-turbo",
    label: "Kling 3.0 Turbo",
    vendor: "KlingAI",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "minimax/minimax-h3-max",
    label: "MiniMax H3 Max",
    vendor: "MiniMax",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "minimax/minimax-h3",
    label: "MiniMax H3",
    vendor: "MiniMax",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "bytedance/doubao-seedance-2.5",
    label: "Doubao Seedance 2.5",
    vendor: "ByteDance",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "bytedance/doubao-seedance-2.0",
    label: "Doubao Seedance 2.0",
    vendor: "ByteDance",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "alibaba/wan3.0-video",
    label: "Wan 3.0 Video",
    vendor: "Alibaba",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "alibaba/wan3.0-video-prime",
    label: "Wan 3.0 Video Prime",
    vendor: "Alibaba",
    provider: "zenmux",
    note: "ZenMux",
  },
  {
    id: "bfl/flux-3-video",
    label: "FLUX.3 Video",
    vendor: "Black Forest Labs",
    provider: "zenmux",
    note: "ZenMux",
  },
  { id: "pixverse/c1", label: "PixVerse C1", vendor: "PixVerse", provider: "zenmux", note: "ZenMux" },
  { id: "pixverse/v6", label: "PixVerse V6", vendor: "PixVerse", provider: "zenmux", note: "ZenMux" },
];

export const CHAT_MODELS: ModelOption[] = [
  { id: "agent", label: "Aurora Creative Director", vendor: "Aurora", provider: "ark" },
  { id: "seed-2-0-pro-260328", label: "Seed 2.0 Pro", vendor: "ByteDance", provider: "ark" },
  { id: "seed-2-0-lite-260428", label: "Seed 2.0 Lite", vendor: "ByteDance", provider: "ark" },
  { id: "seed-2-0-mini-260428", label: "Seed 2.0 Mini", vendor: "ByteDance", provider: "ark" },
  {
    id: "seed-2-0-code-preview-260328",
    label: "Seed 2.0 Code",
    vendor: "ByteDance",
    provider: "ark",
  },
  {
    id: "dola-seed-2-1-turbo-260628",
    label: "Dola Seed 2.1 Turbo",
    vendor: "ByteDance",
    provider: "ark",
  },
  {
    id: "seed-1-8-251228",
    label: "Seed 1.8",
    vendor: "ByteDance",
    provider: "ark",
    note: "Retiring",
  },
  {
    id: "seed-translation-250915",
    label: "Seed Translation",
    vendor: "ByteDance",
    provider: "ark",
  },
  { id: "deepseek-v4-1-flash-260910", label: "DeepSeek V4 Pro", vendor: "DeepSeek", provider: "ark" },
  {
    id: "deepseek-v4-1-flash-260910",
    label: "DeepSeek V4 Flash",
    vendor: "DeepSeek",
    provider: "ark",
  },
  {
    id: "deepseek-v4-flash-ga-260731",
    label: "DeepSeek V3.2",
    vendor: "DeepSeek",
    provider: "ark",
    note: "Retiring",
  },
  { id: "glm-5-3-flash-260828", label: "GLM 5.3 Flash", vendor: "Z.AI", provider: "ark" },
  { id: "glm-5-3-flash-260828", label: "GLM 5.2", vendor: "Z.AI", provider: "ark" },
  // ---- ZenMux ----
  {
    id: "z-ai/glm-4.7-flash-free",
    label: "GLM 4.7 Flash",
    vendor: "Z.AI",
    provider: "zenmux",
    note: "ZenMux · free",
  },
  {
    id: "z-ai/glm-4.6v-flash-free",
    label: "GLM 4.6V Flash",
    vendor: "Z.AI",
    provider: "zenmux",
    note: "ZenMux · free",
  },
  {
    id: "dots-studio/dots3-note-prev",
    label: "Dots3 Note Preview",
    vendor: "Dots Studio",
    provider: "zenmux",
    note: "ZenMux · free",
  },
  {
    id: "atria-asi/atria-dawn-preview",
    label: "Atria Dawn Preview",
    vendor: "Atria",
    provider: "zenmux",
    note: "ZenMux · free",
  },
  {
    id: "inclusionai/ling-3.0-flash-vl",
    label: "Ling 3.0 Flash VL",
    vendor: "inclusionAI",
    provider: "zenmux",
    note: "ZenMux · free",
  },
  {
    id: "inclusionai/ling-3.0-tiny",
    label: "Ling 3.0 Tiny",
    vendor: "inclusionAI",
    provider: "zenmux",
    note: "ZenMux · free",
  },
  {
    id: "sapiens-ai/agnes-2.5-flash",
    label: "Agnes 2.5 Flash",
    vendor: "Sapiens AI",
    provider: "zenmux",
    note: "ZenMux · free",
  },
  {
    id: "google/gemini-3.5-flash-lite",
    label: "Gemini 3.5 Flash Lite",
    vendor: "Google",
    provider: "zenmux",
    note: "ZenMux",
  },
];

export function modelLabel(id: string, list: ModelOption[]): string {
  return list.find((m) => m.id === id)?.label ?? id;
}

export function modelProvider(id: string, list: ModelOption[]): Provider {
  return list.find((m) => m.id === id)?.provider ?? "ark";
}

/** Compact LLM picker shown in the inline Creative Director strip. */
export const DIRECTOR_MODELS: ModelOption[] = [
  {
    id: "dola-seed-2-1-turbo-260628",
    label: "Dola Seed 2.1 Turbo",
    vendor: "ByteDance",
    provider: "ark",
    note: "Fast director",
  },
  {
    id: "qwen/qwen3.8-flash",
    label: "Qwen 3.8 Flash",
    vendor: "Alibaba",
    provider: "zenmux",
    note: "ZenMux · needs balance",
  },
  {
    id: "deepseek-r1-distill-qwen-32b-250120",
    label: "Qwen 32B (R1 distill)",
    vendor: "Alibaba",
    provider: "ark",
    note: "Deep thinker",
  },
  { id: "glm-5-3-flash-260828", label: "GLM 5.3 Flash", vendor: "Z.AI", provider: "ark" },
  { id: "seed-2-0-pro-260328", label: "Seed 2.0 Pro", vendor: "ByteDance", provider: "ark" },
];
