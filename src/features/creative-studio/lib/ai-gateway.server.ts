// @ts-nocheck
// Server-only AI gateway helpers: run-ID propagation + structured Responses calls.
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError, type ModelMessage } from "ai";
import type { z } from "zod";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      const response = await fetch(input, { ...init, headers });
      runId = (runId ?? response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim()) || undefined;
      return response;
    },
    getRunId: () => runId,
  };
}

function provider(apiKey: string) {
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const openai = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return { openai, runIdFetch };
}

type StructuredCall = <T>(fn: () => Promise<T>) => Promise<T>;

/**
 * One structured Responses call: streams server-side, returns the parsed object.
 * Falls back to parsing the raw text when the schema check fails.
 */
export async function structuredResponsesCall<T>(args: {
  apiKey: string;
  model: string;
  system: string;
  messages: ModelMessage[];
  schema: z.ZodType<T>;
}): Promise<{ data: T; raw: string }> {
  const { openai, runIdFetch } = provider(args.apiKey);
  void runIdFetch;
  const result = streamText({
    model: openai.responses(args.model),
    system: args.system,
    messages: args.messages,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
    output: Output.object({ schema: args.schema }),
  });
  let raw = "";
  let data: T | undefined;
  try {
    data = await result.output;
    raw = await result.text;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && typeof error.text === "string" && error.text.trim()) {
      raw = error.text;
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) {
        data = JSON.parse(cleaned.slice(start, end + 1)) as T;
      }
    } else {
      throw error;
    }
  }
  if (!data) throw new Error("The model returned an empty result. Try again.");
  return { data, raw };
}

/** Plain text call for any supported gateway chat model (OpenAI via Responses, others via Chat Completions). */
export async function textCall(args: { apiKey: string; model: string; system: string; prompt: string }): Promise<string> {
  const { openai } = provider(args.apiKey);
  const isOpenAI = args.model.startsWith("openai/");
  const result = streamText({
    model: isOpenAI ? openai.responses(args.model) : openai.chat(args.model),
    system: args.system,
    prompt: args.prompt,
    providerOptions: isOpenAI
      ? { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } }
      : {},
  });
  const text = (await result.text).trim();
  if (!text) throw new Error("The model returned an empty reply. Try again.");
  return text;
}

export function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s < 0 || e <= s) throw new Error("The model did not return a usable plan. Try again.");
  return JSON.parse(cleaned.slice(s, e + 1)) as T;
}
