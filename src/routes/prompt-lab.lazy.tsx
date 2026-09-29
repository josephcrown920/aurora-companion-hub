import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Copy, Image as ImageIcon, Loader2, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { generatePolishedPrompt, type PromptLabResult, type PromptTarget } from "@/lib/prompt-lab.functions";

export const Route = createLazyFileRoute("/prompt-lab")({ component: PromptLabPage });

const STYLE_PRESETS = [
  "Cinematic film still",
  "Editorial fashion",
  "Neon night street",
  "Warm golden hour",
  "Gritty documentary",
  "Clean studio product",
];

const RATIOS = ["9:16", "1:1", "16:9", "4:5"];

function PromptLabPage() {
  const { user } = useAuth();
  const runPrompt = useServerFn(generatePolishedPrompt);

  const [target, setTarget] = useState<PromptTarget>("seedream");
  const [idea, setIdea] = useState("");
  const [styleHint, setStyleHint] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PromptLabResult | null>(null);

  async function handleGenerate() {
    if (idea.trim().length < 3) {
      toast.error("Describe what you want to create first.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const out = await runPrompt({
        data: { idea: idea.trim(), target, styleHint: styleHint || undefined, aspectRatio },
      });
      setResult(out);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not write the prompt. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed — select the text instead.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" /> Home
        </Link>

        <h1 className="text-3xl font-semibold tracking-tight text-white">Prompt Lab</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
          Describe the image or video you have in mind. Aurora rewrites it as a detailed prompt
          tuned for Seedream or Seedance, with a matching negative prompt.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {(
            [
              { id: "seedream" as const, label: "Image · Seedream", Icon: ImageIcon },
              { id: "seedance" as const, label: "Video · Seedance", Icon: Video },
            ]
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTarget(id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                target === id
                  ? "border-[#8b5cf6] bg-[#8b5cf6]/15 text-white"
                  : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        <label className="mt-6 block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Your idea</span>
          <textarea
            rows={4}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={
              target === "seedream"
                ? "Artist in a red puffer on a rainy rooftop at night"
                : "Slow push-in on an artist rapping under red neon, smoke drifting"
            }
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#8b5cf6]"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {STYLE_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyleHint(s === styleHint ? "" : s)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                styleHint === s
                  ? "border-[#8b5cf6] bg-[#8b5cf6]/15 text-white"
                  : "border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Ratio</span>
          {RATIOS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setAspectRatio(r)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                aspectRatio === r
                  ? "border-[#8b5cf6] bg-[#8b5cf6]/15 text-white"
                  : "border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {!user && (
          <p className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            <Link to="/auth" search={{ next: "/prompt-lab" }} className="font-semibold underline">
              Sign in
            </Link>{" "}
            to start writing prompts.
          </p>
        )}

        <Button
          onClick={() => void handleGenerate()}
          disabled={busy || !user}
          className="mt-6 w-full rounded-full bg-[#8b5cf6] py-6 text-base font-semibold text-white hover:bg-[#7c4df0]"
        >
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          {busy ? "Writing your prompt…" : "Write my prompt"}
        </Button>

        {result && (
          <div className="mt-8 space-y-4">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  {target === "seedream" ? "Seedream prompt" : "Seedance prompt"}
                </h2>
                <button
                  type="button"
                  onClick={() => void copy(result.prompt, "Prompt")}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  <Copy className="size-3.5" /> Copy
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{result.prompt}</p>
            </section>

            {result.negativePrompt && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">Negative prompt</h2>
                  <button
                    type="button"
                    onClick={() => void copy(result.negativePrompt, "Negative prompt")}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    <Copy className="size-3.5" /> Copy
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">{result.negativePrompt}</p>
              </section>
            )}

            {result.notes.length > 0 && (
              <ul className="space-y-1.5 text-sm text-zinc-400">
                {result.notes.map((n, i) => (
                  <li key={i}>· {n}</li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-3">
              <Link
                to="/studio"
                search={{ q: result.prompt }}
                className="inline-flex items-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                Use in Studio
              </Link>
              <Link
                to="/video-editor"
                className="inline-flex items-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                Open video editor
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
