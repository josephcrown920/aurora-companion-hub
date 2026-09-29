export type VisualInput =
  | { type: "image"; url?: string; fileId?: string; detail?: "low" | "high" | "xhigh"; label?: string }
  | { type: "video"; url?: string; fileId?: string; fps?: number; label?: string }
  | { type: "text"; text: string };

export type MultimodalAnalysis = {
  model: string;
  instruction: string;
  inputs: VisualInput[];
};

function toContent(input: VisualInput) {
  if (input.type === "text") return { type: "text", text: input.text };
  if (input.type === "image") {
    return {
      type: "image_url",
      image_url: input.fileId ? { file_id: input.fileId, detail: input.detail ?? "high" } : { url: input.url, detail: input.detail ?? "high" },
    };
  }
  return {
    type: "video_url",
    video_url: input.fileId ? { file_id: input.fileId, fps: input.fps ?? 1 } : { url: input.url, fps: input.fps ?? 1 },
  };
}

export async function analyzeMultimodal(
  instruction: string,
  inputs: VisualInput[],
  model = "deepseek-v4-1-flash-260910",
) {
  const input = [
    { role: "system", content: "You are Aurora Vision, a production-analysis specialist. Return observed facts, inferred intent, continuity risks, editable timeline opportunities, and structured character/scene data." },
    {
      role: "user",
      content: [{ type: "text", text: instruction }, ...inputs.map(toContent)],
    },
  ];

  const response = await fetch("/api/canvas/modelark", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input }),
  });

  if (!response.ok) throw new Error("ModelArk multimodal analysis failed.");
  return response.json();
}

export async function reviewShotContinuity(
  inputs: VisualInput[],
  instruction = "Review this shot for character identity, blocking, screen direction, wardrobe, lighting, props, camera continuity and likely edit points.",
) {
  return analyzeMultimodal(instruction, inputs, "glm-5-3-flash-260828");
}
