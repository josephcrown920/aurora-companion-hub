export type ProviderName = "modelark" | "bagel" | "local";

export type GenerationPayload = {
  kind: "image" | "video" | "chat";
  modelId: string;
  brief: string;
  aspect?: "1:1" | "16:9" | "9:16";
  durationSeconds?: number;
  provider?: ProviderName;
};

export async function requestModelGeneration(payload: GenerationPayload) {
  const res = await fetch("/api/canvas/model-gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Generation request failed");
  }

  return res.json();
}
