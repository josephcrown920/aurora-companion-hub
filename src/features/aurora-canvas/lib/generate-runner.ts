import { submitGatewayRequest } from "./model-gateway";

export async function runProjectBrief(brief: string, modelId: string) {
  const payload = {
    kind: "video",
    modelId,
    brief,
    aspect: "16:9",
    durationSeconds: 12,
  } as const;

  return submitGatewayRequest(payload);
}
