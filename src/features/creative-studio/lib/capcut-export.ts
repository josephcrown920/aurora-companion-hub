// Builds a CapCut-compatible draft structure plus a plain-text shot list
// from the studio's layer timeline.
import type { LayerItem } from "@/features/creative-studio/components/video/LayersEditor";

export type CapCutRatio = "9:16" | "16:9" | "1:1";

const SIZES: Record<CapCutRatio, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "1:1": { width: 1080, height: 1080 },
};

const US = 1_000_000; // CapCut stores time in microseconds

const TRACK_TYPE: Record<LayerItem["type"], string> = {
  video: "video",
  image: "video",
  overlay: "video",
  text: "text",
  audio: "audio",
};

export function buildCapCutDraft(layers: LayerItem[], ratio: CapCutRatio) {
  const size = SIZES[ratio];
  const duration = Math.round(
    layers.reduce((end, l) => Math.max(end, l.start + l.duration), 0) * US,
  );

  const materials = {
    videos: layers
      .filter((l) => l.type === "video" || l.type === "image" || l.type === "overlay")
      .map((l) => ({
        id: l.id,
        type: l.type === "video" ? "video" : "photo",
        material_name: l.name,
        duration: Math.round(l.duration * US),
        width: size.width,
        height: size.height,
        path: "",
      })),
    texts: layers
      .filter((l) => l.type === "text")
      .map((l) => ({
        id: l.id,
        content: l.name,
        font_size: 12,
        text_color: "#FFFFFF",
        alignment: 1,
      })),
    audios: layers
      .filter((l) => l.type === "audio")
      .map((l) => ({
        id: l.id,
        name: l.name,
        duration: Math.round(l.duration * US),
        path: "",
      })),
  };

  const tracks = layers.map((l, index) => ({
    id: `track-${l.id}`,
    type: TRACK_TYPE[l.type],
    attribute: l.visible ? 0 : 1,
    flag: l.locked ? 1 : 0,
    segments: [
      {
        id: `segment-${l.id}`,
        material_id: l.id,
        render_index: index,
        visible: l.visible,
        target_timerange: {
          start: Math.round(l.start * US),
          duration: Math.round(l.duration * US),
        },
        source_timerange: { start: 0, duration: Math.round(l.duration * US) },
        clip: {
          alpha: l.opacity,
          rotation: 0,
          scale: { x: l.scale, y: l.scale },
          transform: { x: l.x / 100, y: l.y / 100 },
          flip: { horizontal: false, vertical: false },
        },
        speed: 1,
        volume: 1,
      },
    ],
  }));

  return {
    app_version: "aurora-studio",
    create_time: Date.now(),
    duration,
    canvas_config: { ...size, ratio },
    fps: 30,
    materials,
    tracks,
  };
}

export function buildEdl(layers: LayerItem[], ratio: CapCutRatio) {
  const lines = [
    `AURORA STUDIO SHOT LIST — ${ratio}`,
    `Total length: ${layers.reduce((end, l) => Math.max(end, l.start + l.duration), 0).toFixed(1)}s`,
    "",
  ];
  layers.forEach((l, i) => {
    lines.push(
      `${String(i + 1).padStart(2, "0")}. [${l.type.toUpperCase()}] ${l.name}`,
      `    in ${l.start.toFixed(1)}s  out ${(l.start + l.duration).toFixed(1)}s  (${l.duration.toFixed(1)}s)`,
      `    opacity ${Math.round(l.opacity * 100)}%  scale ${l.scale.toFixed(2)}  offset ${l.x}/${l.y}${l.visible ? "" : "  [hidden]"}`,
    );
  });
  return lines.join("\n");
}
