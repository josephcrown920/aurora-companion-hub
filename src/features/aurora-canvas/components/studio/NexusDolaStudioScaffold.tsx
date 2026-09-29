import { useMemo, useState } from "react";

import { WORKSPACES, defaultWorkspace, type WorkspaceId } from "../lib/studio-workspaces";
import { MODEL_REGISTRY, getModelsByCategory } from "../lib/studio-model-registry";
import { defaultStudioRuntimeState } from "../lib/workflow-state";
import { requestModelGeneration } from "../lib/provider-adapters";
import { primeSpeech, speak } from "../lib/aurora-voice";
import ComfyWorkflowLibrary from "./ComfyWorkflowLibrary";

const WORKFLOW_STEPS = [
  "brief_received",
  "analysis",
  "prompt_generation",
  "asset_generation",
  "timeline_assembly",
  "review",
  "export",
] as const;

const workflowLabelMap: Record<(typeof WORKFLOW_STEPS)[number], string> = {
  brief_received: "Brief received",
  analysis: "Analysis",
  prompt_generation: "Prompt generation",
  asset_generation: "Asset generation",
  timeline_assembly: "Timeline assembly",
  review: "Review",
  export: "Export",
};

type GeneratedResult = {
  id: string;
  kind: "image" | "video";
  label: string;
  summary: string;
  provider: string;
  status: "review" | "approved" | "exported";
};

export default function NexusDolaStudioScaffold() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>(defaultWorkspace);
  const [selectedModelId, setSelectedModelId] = useState<string>("dola-seed-2-1-turbo-260628");
  const [brief, setBrief] = useState("");
  const [runtime, setRuntime] = useState(defaultStudioRuntimeState);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const models = useMemo(() => getModelsByCategory("assistant"), []);
  const activeModel = useMemo(
    () => MODEL_REGISTRY.find((model) => model.id === selectedModelId) ?? MODEL_REGISTRY[0],
    [selectedModelId],
  );

  const selectedResult = useMemo(
    () => results.find((result) => result.id === selectedResultId) ?? results[0] ?? null,
    [results, selectedResultId],
  );

  const handleRunWorkflow = async () => {
    if (!brief.trim()) return;

    setRuntime((prev) => ({
      ...prev,
      selectedModel: selectedModelId,
      currentBrief: brief,
      currentStep: "brief_received",
      workflowStatus: "queued",
    }));
    setIsRunning(true);
    primeSpeech();
    if (voiceEnabled) void speak("I’m starting the production workflow now.");

    try {
      const generated = await requestModelGeneration({
        kind: "video",
        modelId: selectedModelId,
        brief,
        aspect: "16:9",
        durationSeconds: 12,
        provider: activeModel?.provider,
      });

      const item: GeneratedResult = {
        id: generated?.jobId ?? `job-${Date.now()}`,
        kind: "video",
        label: generated?.title ?? "Generated hero clip",
        summary:
          generated?.summary ??
          "Scene concept generated with the selected model, ready for review and export.",
        provider: activeModel?.provider ?? "modelark",
        status: "review",
      };

      setResults((prev) => [item, ...prev]);
      setSelectedResultId(item.id);
      setRuntime((prev) => ({
        ...prev,
        selectedModel: selectedModelId,
        currentBrief: brief,
        currentStep: "review",
        workflowStatus: "review",
      }));
      if (voiceEnabled) void speak(item.summary);
    } catch (error) {
      const demo: GeneratedResult = {
        id: `demo-${Date.now()}`,
        kind: "video",
        label: "Demo review cut",
        summary:
          "Fallback demo result generated locally because the gateway endpoint is unavailable. This keeps the studio in a reviewable state.",
        provider: activeModel?.provider ?? "local",
        status: "review",
      };

      setResults((prev) => [demo, ...prev]);
      setSelectedResultId(demo.id);
      setRuntime((prev) => ({
        ...prev,
        selectedModel: selectedModelId,
        currentBrief: brief,
        currentStep: "review",
        workflowStatus: "review",
      }));
      console.error("Workflow failed, using demo result:", error);
      if (voiceEnabled) void speak(demo.summary);
    } finally {
      setIsRunning(false);
    }
  };

  const handleApprove = () => {
    if (!selectedResult) return;

    setResults((prev) =>
      prev.map((result) =>
        result.id === selectedResult.id ? { ...result, status: "approved" } : result,
      ),
    );
    setRuntime((prev) => ({
      ...prev,
      currentStep: "export",
      workflowStatus: "done",
    }));
  };

  const handleExport = () => {
    if (!selectedResult) return;

    setResults((prev) =>
      prev.map((result) =>
        result.id === selectedResult.id ? { ...result, status: "exported" } : result,
      ),
    );
    setRuntime((prev) => ({
      ...prev,
      currentStep: "export",
      workflowStatus: "done",
    }));
  };

  const statusTone = {
    idle: { background: "rgba(255,255,255,0.02)", color: "#edf2ff" },
    queued: { background: "rgba(84,145,255,0.12)", color: "#dfe7ff" },
    running: { background: "rgba(124,243,219,0.12)", color: "#9ff8ef" },
    review: { background: "rgba(255,186,73,0.12)", color: "#ffe4aa" },
    done: { background: "rgba(117,255,161,0.12)", color: "#bafed2" },
  }[runtime.workflowStatus];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "260px minmax(0, 1fr)",
        background: "#05070d",
        color: "#edf2ff",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <aside
        style={{
          background: "rgba(15,19,30,0.94)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          padding: "22px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 700,
            fontSize: "18px",
            marginBottom: "18px",
            padding: "0 8px",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: "linear-gradient(135deg, #77f1db, #85a4ff)",
              display: "grid",
              placeItems: "center",
              color: "#071018",
              fontSize: "12px",
            }}
          >
            A
          </div>
          Nexus Dola
        </div>

        <nav style={{ display: "grid", gap: 8 }}>
          {WORKSPACES.map((workspace) => {
            const active = workspace.id === activeWorkspace;
            return (
              <button
                key={workspace.id}
                type="button"
                onClick={() => setActiveWorkspace(workspace.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: active
                    ? "1px solid rgba(113, 235, 214, 0.8)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: active ? "rgba(17, 243, 205, 0.12)" : "rgba(255,255,255,0.02)",
                  color: active ? "#dffef8" : "#dbe4ff",
                  borderRadius: 12,
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>{workspace.icon}</span>
                  <span style={{ fontWeight: 600 }}>{workspace.label}</span>
                </span>
                {active && <span style={{ fontSize: 10, opacity: 0.9 }}>●</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <main
        style={{
          padding: "28px 24px 24px",
          background: "radial-gradient(circle at top, rgba(110,140,255,0.12), transparent 35%), #05070d",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                opacity: 0.75,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Studio Workspace
            </div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {WORKSPACES.find((w) => w.id === activeWorkspace)?.label}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "#edf2ff",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              {MODEL_REGISTRY.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleRunWorkflow}
              disabled={!brief.trim() || isRunning}
              style={{
                background: "linear-gradient(135deg, #7cf3db, #8dff7c)",
                color: "#08100f",
                border: 0,
                borderRadius: 10,
                padding: "10px 16px",
                fontWeight: 800,
                cursor: brief.trim() && !isRunning ? "pointer" : "default",
                opacity: brief.trim() && !isRunning ? 1 : 0.6,
              }}
            >
              {isRunning ? "Running..." : "Run workflow"}
            </button>
            <button
              type="button"
              onClick={() => { setVoiceEnabled(!voiceEnabled); if (!voiceEnabled) { primeSpeech(); void speak("Voice replies are now enabled."); } }}
              style={{ background: voiceEnabled ? "rgba(124,243,219,0.12)" : "rgba(255,255,255,0.03)", color: voiceEnabled ? "#8ef7df" : "#aeb6c8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontWeight: 700 }}
            >
              {voiceEnabled ? "🔊 Voice" : "🔇 Voice"}
            </button>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(260px, 420px)",
            gap: 20,
          }}
        >
          <div
            style={{
              borderRadius: 18,
              padding: 22,
              background: "rgba(18,22,32,0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
              minHeight: 460,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 18,
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.7,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  Active model
                </div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{activeModel?.label}</div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(124,243,219,0.12)",
                  color: "#8ef7df",
                  border: "1px solid rgba(124,243,219,0.38)",
                }}
              >
                {activeModel?.provider}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                fontSize: 14,
                opacity: 0.86,
              }}
            >
              <div
                style={{
                  borderRadius: 14,
                  padding: 16,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Creative brief</div>
                <textarea
                  rows={7}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Describe a scene, style, camera move, mood, shot structure, and references..."
                  style={{
                    width: "100%",
                    resize: "none",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(9,11,17,0.9)",
                    color: "#edf2ff",
                    padding: 14,
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                  gap: 12,
                }}
              >
                {models.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModelId(model.id)}
                    style={{
                      textAlign: "left",
                      padding: 14,
                      background:
                        selectedModelId === model.id
                          ? "rgba(124,243,219,0.12)"
                          : "rgba(255,255,255,0.02)",
                      border:
                        selectedModelId === model.id
                          ? "1px solid rgba(124,243,219,0.45)"
                          : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12,
                      color: "#edf2ff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{model.label}</div>
                    <div style={{ opacity: 0.75, marginTop: 6 }}>{model.description}</div>
                  </button>
                ))}
              </div>

              <div
                style={{
                  borderRadius: 12,
                  padding: 14,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.7,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  Runtime status
                </div>
                <div style={{ marginTop: 8, fontWeight: 700 }}>
                  {runtime.workflowStatus.toUpperCase()} · {runtime.currentStep}
                </div>
                <div style={{ marginTop: 6, opacity: 0.8 }}>
                  {runtime.currentBrief || "No active brief yet"}
                </div>
              </div>
            </div>
          </div>

          <aside
            style={{
              borderRadius: 18,
              padding: 18,
              background: "rgba(18,22,32,0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
              minHeight: 460,
            }}
          >
            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Orchestration
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, margin: "8px 0 16px" }}>
              Agent stack
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                "Creative Director",
                "Reference Analyst",
                "Prompt Agent",
                "Editor Agent",
                "Motion Agent",
                "Memory Agent",
                "Review Agent",
              ].map((name, index) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  <span>{name}</span>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: index < 3 ? "#7cf3db" : "#d6d9ee",
                      opacity: index < 3 ? 1 : 0.75,
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Workflow steps
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {WORKFLOW_STEPS.map((step, index) => {
                  const currentIndex = WORKFLOW_STEPS.indexOf(runtime.currentStep as any);
                  return (
                    <div
                      key={step}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.06)",
                        background:
                          runtime.currentStep === step
                            ? "rgba(124,243,219,0.12)"
                            : "rgba(255,255,255,0.02)",
                        padding: "8px 10px",
                      }}
                    >
                      <span>{workflowLabelMap[step]}</span>
                      <span style={{ fontSize: 11, opacity: 0.8 }}>
                        {runtime.currentStep === step ? "active" : index < currentIndex ? "done" : "queued"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                borderRadius: 12,
                padding: 14,
                background: statusTone.background,
                border: "1px solid rgba(255,255,255,0.08)",
                color: statusTone.color,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.8,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Current state
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>
                {runtime.workflowStatus.toUpperCase()}
              </div>
            </div>
          </aside>
        </section>

        {results.length > 0 && (
          <section
            style={{
              marginTop: 20,
              borderRadius: 18,
              background: "rgba(18,22,32,0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.7,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  Review output
                </div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>Generated assets</div>
              </div>

              <button
                type="button"
                onClick={handleExport}
                style={{
                  background: "rgba(124,243,219,0.12)",
                  color: "#8ef7df",
                  border: "1px solid rgba(124,243,219,0.38)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Export final
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => setSelectedResultId(result.id)}
                  style={{
                    textAlign: "left",
                    borderRadius: 14,
                    border:
                      selectedResult?.id === result.id
                        ? "1px solid rgba(124,243,219,0.4)"
                        : "1px solid rgba(255,255,255,0.08)",
                    background:
                      selectedResult?.id === result.id
                        ? "rgba(124,243,219,0.12)"
                        : "rgba(255,255,255,0.02)",
                    color: "#edf2ff",
                    padding: 14,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{result.label}</div>
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>{result.kind.toUpperCase()}</div>
                  <div style={{ marginTop: 10, opacity: 0.85 }}>{result.summary}</div>
                  <div style={{ marginTop: 10, fontSize: 11, opacity: 0.8, textTransform: "uppercase" }}>
                    {result.status}
                  </div>
                </button>
              ))}
            </div>

            {selectedResult && (
              <div
                style={{
                  marginTop: 18,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Selected asset
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{selectedResult.label}</div>
                <div style={{ marginTop: 10, opacity: 0.9 }}>{selectedResult.summary}</div>
                <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                  Provider: {selectedResult.provider} · Status: {selectedResult.status}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={handleApprove}
                    style={{
                      background: "rgba(255,186,73,0.12)",
                      color: "#ffd88f",
                      border: "1px solid rgba(255,186,73,0.38)",
                      borderRadius: 10,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    style={{
                      background: "rgba(124,243,219,0.12)",
                      color: "#8ef7df",
                      border: "1px solid rgba(124,243,219,0.38)",
                      borderRadius: 10,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Send to export
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
        <ComfyWorkflowLibrary />
      </main>
    </div>
  );
}
