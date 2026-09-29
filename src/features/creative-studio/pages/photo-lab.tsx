import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import "@/features/creative-studio/aurora.css";
import { StudioNav } from "@/features/creative-studio/components/studio/StudioNav";
import { DEFAULT_ADJUST, LOOKS, cssFilter, type Adjust } from "@/features/creative-studio/lib/pro-presets";

export const Route = createFileRoute("/photo-lab")({
  head: () => ({
    meta: [
      { title: "Photo Lab — Aurora Studio" },
      { name: "description", content: "Retouch stills with Out The Mud looks, manual sliders and a one-click upscale." },
      { property: "og:title", content: "Photo Lab — Aurora Studio" },
      { property: "og:description", content: "Ten cinematic looks, fine sliders and export at up to 4x." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PhotoLabPage,
});

const SLIDERS: { key: keyof Adjust; label: string; min: number; max: number }[] = [
  { key: "brightness", label: "Brightness", min: 50, max: 150 },
  { key: "contrast", label: "Contrast", min: 50, max: 200 },
  { key: "saturate", label: "Saturation", min: 0, max: 200 },
  { key: "hue", label: "Hue", min: -180, max: 180 },
  { key: "blur", label: "Softness", min: 0, max: 6 },
  { key: "sepia", label: "Warmth", min: 0, max: 100 },
  { key: "grayscale", label: "Black & white", min: 0, max: 100 },
  { key: "vignette", label: "Vignette", min: 0, max: 100 },
  { key: "grain", label: "Grain", min: 0, max: 100 },
  { key: "sharpen", label: "Sharpen", min: 0, max: 100 },
];

function PhotoLabPage() {
  const [src, setSrc] = useState<string | null>(null);
  const [adjust, setAdjust] = useState<Adjust>(DEFAULT_ADJUST);
  const [scale, setScale] = useState(2);
  const [status, setStatus] = useState("");
  const filter = useMemo(() => cssFilter(adjust), [adjust]);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setSrc(URL.createObjectURL(file));
    setStatus("");
  };

  const exportImage = async () => {
    if (!src) return;
    setStatus("Rendering…");
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.filter = filter;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (adjust.vignette > 0) {
      const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.3, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.75);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,0,${adjust.vignette / 130})`);
      ctx.filter = "none";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/jpeg", 0.95);
    a.download = `aurora-photo-${scale}x.jpg`;
    a.click();
    setStatus(`Saved at ${canvas.width}×${canvas.height}.`);
  };

  return (
    <div className="aurora-body aurora-page">
      <StudioNav />
      <div className="aurora-wrap">
        <h1 className="aurora-page-title">Photo Lab</h1>
        <p className="aurora-page-sub">Pick a look, fine-tune it, then export larger than the original.</p>

        <div className="aurora-panel">
          <label className="aurora-field">
            Photo
            <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {src && (
            <div className="aurora-photo-preview">
              <img src={src} alt="Preview" style={{ filter }} />
              {adjust.vignette > 0 && <span className="vig" style={{ opacity: adjust.vignette / 130 }} />}
              {adjust.grain > 0 && <span className="grain" style={{ opacity: adjust.grain / 220 }} />}
            </div>
          )}
          <div className="aurora-row wrap">
            {LOOKS.map((l) => (
              <button key={l.id} className="aurora-chip-btn" onClick={() => setAdjust({ ...DEFAULT_ADJUST, ...l.adjust })} title={l.note}>
                {l.name}
              </button>
            ))}
            <button className="aurora-chip-btn" onClick={() => setAdjust(DEFAULT_ADJUST)}>Reset</button>
          </div>
          <div className="aurora-sliders">
            {SLIDERS.map((s) => (
              <label key={s.key}>
                <span>
                  {s.label} <em>{adjust[s.key]}</em>
                </span>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.key === "blur" ? 0.1 : 1}
                  value={adjust[s.key]}
                  onChange={(e) => setAdjust({ ...adjust, [s.key]: Number(e.target.value) })}
                />
              </label>
            ))}
          </div>
          <div className="aurora-row">
            <label className="aurora-field">
              Upscale
              <select value={scale} onChange={(e) => setScale(Number(e.target.value))}>
                <option value={1}>Original size</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </label>
            <button className="aurora-btn primary" onClick={() => void exportImage()} disabled={!src}>
              Export photo
            </button>
          </div>
          {status && <p className="aurora-note">{status}</p>}
        </div>
      </div>
    </div>
  );
}
