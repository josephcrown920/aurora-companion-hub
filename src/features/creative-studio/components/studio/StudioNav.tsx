// @ts-nocheck
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LLMS, type LlmId } from "@/features/creative-studio/lib/pro-presets";

export const WORKSPACES = [
  { to: "/video-agent", icon: "🎨", name: "Generator & Director", note: "Images, video and the creative director" },
  { to: "/video-agent/timeline", icon: "🎬", name: "Multi-Track Timeline", note: "V1–V4, A1–A3, beat markers, effects" },
  { to: "/video-agent/beat-director", icon: "⚡", name: "Beat Sync Director", note: "Upload a track, get a cut on the beat" },
  { to: "/video-agent/workflows", icon: "🧩", name: "Workflows", note: "ComfyUI import, build and run" },
  { to: "/video-agent/photo-lab", icon: "📸", name: "Photo Lab", note: "Filters, retouch and upscale" },
] as const;

export const LLM_KEY = "aurora_llm";

export function useLlm(): [LlmId, (v: LlmId) => void] {
  const [llm, setLlm] = useState<LlmId>("openai/gpt-6-astra");
  useEffect(() => {
    const saved = window.localStorage.getItem(LLM_KEY) as LlmId | null;
    if (saved && LLMS.some((l) => l.id === saved)) setLlm(saved);
  }, []);
  return [
    llm,
    (v: LlmId) => {
      setLlm(v);
      window.localStorage.setItem(LLM_KEY, v);
    },
  ];
}

export function StudioNav() {
  const [open, setOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [llm, setLlm] = useLlm();
  const wrap = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = WORKSPACES.find((w) => w.to === path) ?? WORKSPACES[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setOpen(false);
        setModelOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="aurora-nav" ref={wrap}>
      <Link to="/video-agent" className="aurora-nav-brand">
        <span className="dot" /> Aurora Studio
      </Link>

      <div className="aurora-nav-switch">
        <button className="aurora-nav-current" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span className="ico">{current.icon}</span>
          <span className="txt">{current.name}</span>
          <span className="chev">▾</span>
        </button>
        {open && (
          <div className="aurora-nav-menu">
            {WORKSPACES.map((w) => (
              <Link key={w.to} to={w.to} className={`aurora-nav-item${w.to === current.to ? " active" : ""}`} onClick={() => setOpen(false)}>
                <span className="ico">{w.icon}</span>
                <span>
                  <strong>{w.name}</strong>
                  <em>{w.note}</em>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="aurora-nav-right">
        <div className="aurora-nav-switch">
          <button className="aurora-nav-pill" onClick={() => setModelOpen((v) => !v)}>
            {LLMS.find((l) => l.id === llm)?.label ?? "Model"} <span className="chev">▾</span>
          </button>
          {modelOpen && (
            <div className="aurora-nav-menu right">
              {LLMS.map((l) => (
                <button
                  key={l.id}
                  className={`aurora-nav-item${l.id === llm ? " active" : ""}`}
                  onClick={() => {
                    setLlm(l.id);
                    setModelOpen(false);
                  }}
                >
                  <span className="ico">◆</span>
                  <span>
                    <strong>{l.label}</strong>
                    <em>{l.id}</em>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
