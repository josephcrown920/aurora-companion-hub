// Shared presets, effects, and model lists for the Pro Suite (browser-safe).

export const LLMS = [
  { id: "openai/gpt-6-astra", label: "GPT-6 Astra" },
  { id: "openai/gpt-6-sol", label: "GPT-6 Sol" },
  { id: "openai/gpt-6-luna", label: "GPT-6 Luna (fast)" },
  { id: "openai/gpt-5.5", label: "GPT-5.5" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
  { id: "google/gemini-3.8-flash", label: "Gemini 3.8 Flash" },
  { id: "google/gemini-3.1-flash-lite", label: "Gemini Flash Lite" },
] as const;
export type LlmId = (typeof LLMS)[number]["id"];
export const LLM_IDS = LLMS.map((l) => l.id) as unknown as [LlmId, ...LlmId[]];

export type Adjust = {
  brightness: number; contrast: number; saturate: number; hue: number;
  blur: number; sepia: number; grayscale: number; vignette: number; grain: number; sharpen: number;
};
export const DEFAULT_ADJUST: Adjust = {
  brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0, sepia: 0, grayscale: 0, vignette: 0, grain: 0, sharpen: 0,
};

export type Preset = { id: string; name: string; note: string; adjust: Partial<Adjust> };

/** Image looks (Hypic-style filters) — also used as video grades. */
export const LOOKS: Preset[] = [
  { id: "mud", name: "Out The Mud", note: "Crushed blacks, cold chrome", adjust: { contrast: 135, saturate: 70, brightness: 92, hue: -8, vignette: 55, grain: 18 } },
  { id: "rain", name: "PH Rain", note: "Wet blue night", adjust: { contrast: 115, saturate: 85, hue: 195, brightness: 90, vignette: 40, sepia: 10 } },
  { id: "chrome", name: "Chrome 3D", note: "Silver, high-key metal", adjust: { grayscale: 80, contrast: 150, brightness: 108, sharpen: 40 } },
  { id: "drill", name: "UK Drill", note: "Desaturated, gritty", adjust: { saturate: 45, contrast: 125, grain: 35, vignette: 45 } },
  { id: "trap", name: "Trap Gold", note: "Warm money tones", adjust: { sepia: 35, saturate: 140, contrast: 115, hue: -10 } },
  { id: "vhs", name: "VHS", note: "Retro tape", adjust: { saturate: 130, contrast: 90, blur: 1, grain: 45, hue: 12 } },
  { id: "noir", name: "Noir", note: "Black & white film", adjust: { grayscale: 100, contrast: 145, vignette: 60, grain: 25 } },
  { id: "neon", name: "Neon Lagos", note: "Magenta/cyan pop", adjust: { saturate: 175, contrast: 120, hue: 300 } },
  { id: "soft", name: "Soft Glow", note: "Beauty skin", adjust: { brightness: 108, contrast: 92, blur: 0.6, saturate: 110 } },
  { id: "hdr", name: "HDR Punch", note: "Crisp detail", adjust: { contrast: 130, saturate: 125, sharpen: 60 } },
];

/** CapCut-style effects that can sit on beats. */
export const EFFECTS = [
  { id: "flash", name: "White Flash", beat: "kick" },
  { id: "shake", name: "Camera Shake", beat: "808" },
  { id: "zoom", name: "Zoom Punch", beat: "kick" },
  { id: "rgb", name: "RGB Split", beat: "snare" },
  { id: "glitch", name: "Glitch", beat: "snare" },
  { id: "strobe", name: "Strobe", beat: "hat roll" },
  { id: "speed", name: "Speed Ramp", beat: "drop" },
  { id: "freeze", name: "Freeze Frame", beat: "drop" },
  { id: "blur", name: "Motion Blur", beat: "transition" },
  { id: "flare", name: "Lens Flare", beat: "hook" },
  { id: "rain", name: "Rain Overlay", beat: "bed" },
  { id: "smoke", name: "Smoke Overlay", beat: "bed" },
  { id: "letterbox", name: "Letterbox", beat: "bed" },
  { id: "invert", name: "Invert Hit", beat: "808" },
] as const;
export type EffectId = (typeof EFFECTS)[number]["id"];

/** CapCut tool shelf. */
export const TOOLS = ["Split", "Trim", "Speed", "Reverse", "Freeze", "Mirror", "Crop", "Mask", "Chroma key", "Keyframe", "Auto captions", "Beat sync", "Retouch", "Remove BG", "Stabilize", "Upscale"] as const;

export type VideoPreset = { id: string; name: string; ratio: "9:16" | "16:9" | "1:1"; seconds: number; bpm: number; genre: "trap" | "drill"; look: string };
export const VIDEO_PRESETS: VideoPreset[] = [
  { id: "teaser", name: "15s Drill Teaser", ratio: "9:16", seconds: 15, bpm: 142, genre: "drill", look: "drill" },
  { id: "reel", name: "30s Trap Reel", ratio: "9:16", seconds: 30, bpm: 140, genre: "trap", look: "trap" },
  { id: "hook", name: "Hook Loop 8s", ratio: "9:16", seconds: 8, bpm: 140, genre: "trap", look: "mud" },
  { id: "mv", name: "Full Music Video", ratio: "16:9", seconds: 180, bpm: 142, genre: "drill", look: "rain" },
  { id: "square", name: "Square Promo", ratio: "1:1", seconds: 20, bpm: 130, genre: "trap", look: "chrome" },
];

export function cssFilter(a: Adjust): string {
  return [
    `brightness(${a.brightness}%)`, `contrast(${a.contrast + a.sharpen * 0.3}%)`, `saturate(${a.saturate}%)`,
    `hue-rotate(${a.hue}deg)`, `blur(${a.blur}px)`, `sepia(${a.sepia}%)`, `grayscale(${a.grayscale}%)`,
  ].join(" ");
}

/** Deterministic beat grid → effect hits. Used offline and by Auto mode. */
export function beatGrid(bpm: number, seconds: number, genre: "trap" | "drill") {
  const beat = 60 / bpm;
  const hits: { t: number; kind: string; effect: EffectId }[] = [];
  for (let i = 0; i * beat < seconds; i++) {
    const t = +(i * beat).toFixed(3);
    const bar = Math.floor(i / 4);
    const pos = i % 4;
    if (pos === 0) hits.push({ t, kind: "kick", effect: bar % 4 === 0 ? "flash" : "zoom" });
    else if (pos === 2) hits.push({ t, kind: "snare", effect: genre === "drill" ? "rgb" : "glitch" });
    else if (genre === "drill" && pos === 3 && bar % 2 === 1) hits.push({ t: +(t + beat / 2).toFixed(3), kind: "808 slide", effect: "shake" });
    else if (genre === "trap" && pos === 3 && bar % 4 === 3) hits.push({ t, kind: "hat roll", effect: "strobe" });
  }
  return hits;
}
