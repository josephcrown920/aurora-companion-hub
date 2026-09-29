export type GatewayRequest =
  | {
      kind: "image";
      modelId: string;
      brief: string;
      aspect?: "1:1" | "16:9" | "9:16";
    }
  | {
      kind: "video";
      modelId: string;
      brief: string;
      aspect?: "1:1" | "16:9" | "9:16";
      durationSeconds?: number;
    }
  | {
      kind: "chat";
      modelId: string;
      brief: string;
    };

export async function submitGatewayRequest(payload: GatewayRequest) {
  const response = await fetch("/api/canvas/model-gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Gateway request failed");
  }

  return response.json();
}
