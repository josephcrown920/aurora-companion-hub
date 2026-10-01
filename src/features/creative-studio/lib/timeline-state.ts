// @ts-nocheck
// Shared multi-track timeline document (browser-safe).
export const VIDEO_TRACKS = ["V4", "V3", "V2", "V1"] as const;
export const AUDIO_TRACKS = ["A1", "A2", "A3"] as const;
export const TRACKS = [...VIDEO_TRACKS, ...AUDIO_TRACKS] as const;
export type TrackId = (typeof TRACKS)[number];

export const TRACK_LABELS: Record<TrackId, string> = {
  V4: "FX & overlays",
  V3: "Titles",
  V2: "B-roll",
  V1: "Main footage",
  A1: "Vocals",
  A2: "808 / kick",
  A3: "SFX",
};

export type ClipKind = "video" | "image" | "text" | "overlay" | "audio";

export type Clip = {
  id: string;
  track: TrackId;
  start: number;
  duration: number;
  /** Offset in seconds into the original media after a left trim or split. */
  sourceOffset?: number;
  name: string;
  kind: ClipKind;
  prompt?: string;
  camera?: string;
  effect?: string;
  look?: string;
  src?: string;
  locked?: boolean;
};

export type BeatHit = { t: number; effect: string; kind: string };

export type TimelineDoc = {
  name: string;
  ratio: "9:16" | "16:9" | "1:1";
  bpm: number;
  genre: "trap" | "drill";
  seconds: number;
  clips: Clip[];
  hits: BeatHit[];
};

export const KEY = "aurora_timeline_v1";

export function emptyTimeline(): TimelineDoc {
  return { name: "Main cut", ratio: "9:16", bpm: 140, genre: "drill", seconds: 30, clips: [], hits: [] };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function loadTimeline(): TimelineDoc {
  if (typeof window === "undefined") return emptyTimeline();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyTimeline();
    const parsed = JSON.parse(raw) as Partial<TimelineDoc>;
    return { ...emptyTimeline(), ...parsed, clips: parsed.clips ?? [], hits: parsed.hits ?? [] };
  } catch {
    return emptyTimeline();
  }
}

export function saveTimeline(doc: TimelineDoc) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(doc));
  } catch {
    /* storage full or blocked */
  }
}

export function clampClip(c: Clip, seconds: number): Clip {
  const duration = Math.min(Math.max(c.duration, 0.1), seconds);
  const start = Math.min(Math.max(c.start, 0), Math.max(0, seconds - duration));
  return { ...c, start: +start.toFixed(3), duration: +duration.toFixed(3) };
}

/** Nearest beat/onset time within `tol` seconds, else the raw time. */
export function snap(t: number, grid: number[], tol = 0.12): number {
  let best = t;
  let dist = tol;
  for (const g of grid) {
    const d = Math.abs(g - t);
    if (d < dist) {
      dist = d;
      best = g;
    }
  }
  return +best.toFixed(3);
}

export function beatTimes(bpm: number, seconds: number): number[] {
  const beat = 60 / Math.max(40, bpm);
  const out: number[] = [];
  for (let t = 0; t <= seconds; t += beat) out.push(+t.toFixed(3));
  return out;
}

export function fmtTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const f = Math.floor((t % 1) * 30);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
}

export const CLIP_COLORS: Record<ClipKind, string> = {
  video: "rgba(120,190,255,.28)",
  image: "rgba(160,255,220,.26)",
  text: "rgba(255,225,150,.28)",
  overlay: "rgba(235,160,255,.26)",
  audio: "rgba(150,255,175,.24)",
};
