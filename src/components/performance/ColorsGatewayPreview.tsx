import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Film, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { pollColorsGatewayPreview, startColorsGatewayPreview } from "@/lib/colors-gateway.functions";

type Scene = "colors" | "court";

async function sampleMotion(file: File): Promise<File> {
  const source = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = source;
  video.muted = true;
  video.playsInline = true;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not open the performance clip"));
    });
    if (video.duration < 3) throw new Error("Use a performance clip at least three seconds long");
    video.currentTime = Math.min(5, Math.max(0, video.duration - 3.1));
    await new Promise<void>((resolve) => { video.onseeked = () => resolve(); });
    const canvas = document.createElement("canvas");
    canvas.width = 360;
    canvas.height = Math.round(360 * video.videoHeight / video.videoWidth / 2) * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot prepare this video in your browser");
    const stream = canvas.captureStream(16);
    if (!MediaRecorder.isTypeSupported("video/webm")) throw new Error("This browser cannot prepare a short motion reference");
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm", videoBitsPerSecond: 500_000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    const done = new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error("Could not prepare motion reference"));
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    });
    recorder.start();
    await video.play();
    const started = performance.now();
    await new Promise<void>((resolve) => {
      const draw = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (performance.now() - started < 3000) requestAnimationFrame(draw);
        else resolve();
      };
      draw();
    });
    recorder.stop();
    video.pause();
    stream.getTracks().forEach((track) => track.stop());
    const blob = await done;
    if (!blob.size) throw new Error("The motion sample was empty");
    return new File([blob], "performance-reference.webm", { type: "video/webm" });
  } finally {
    URL.revokeObjectURL(source);
    video.remove();
  }
}

export function ColorsGatewayPreview() {
  const { user } = useAuth();
  const start = useServerFn(startColorsGatewayPreview);
  const poll = useServerFn(pollColorsGatewayPreview);
  const [photo, setPhoto] = useState<File | null>(null);
  const [clip, setClip] = useState<File | null>(null);
  const [scene, setScene] = useState<Scene>("court");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState("" );
  const [error, setError] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const clipInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!jobId || !user) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const result = await poll({ data: { jobId } });
        if (cancelled) return;
        if (result.status === "completed" && result.url) {
          setUrl(result.url);
          setStatus("Preview ready");
          setJobId(null);
        } else if (result.status === "failed") {
          setError(result.error ?? "Preview failed");
          setJobId(null);
        } else {
          setStatus(`Generating preview${result.progress ? ` · ${Math.round(result.progress)}%` : "…"}`);
          timer = setTimeout(check, 8000);
        }
      } catch (failure) {
        if (!cancelled) { setError(failure instanceof Error ? failure.message : "Could not check preview"); setJobId(null); }
      }
    };
    void check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [jobId, user, poll]);

  async function upload(file: File, kind: "image" | "video") {
    if (!user) throw new Error("Sign in to create a preview");
    const path = `${user.id}/colors-previews/${crypto.randomUUID()}.${kind === "image" ? "jpg" : "webm"}`;
    const { error: uploadError } = await supabase.storage.from("studio").upload(path, file, { contentType: kind === "image" ? "image/jpeg" : "video/webm", upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    return path;
  }

  async function generate() {
    if (!photo || !clip || !user) return;
    setBusy(true);
    setError("");
    setUrl(null);
    setStatus("Preparing motion reference…");
    try {
      if (!/^image\/jpeg$/.test(photo.type) || photo.size > 12 * 1024 * 1024) throw new Error("Choose a JPEG portrait under 12 MB");
      const isVideo = clip.type.startsWith("video/") || /\.(mov|mp4|webm|m4v|avi|mkv)$/i.test(clip.name);
      if (!isVideo || clip.size > 100 * 1024 * 1024) throw new Error("Choose a video under 100 MB");
      const sample = await sampleMotion(clip);
      setStatus("Uploading your portrait and motion…");
      const [imagePath, videoPath] = await Promise.all([upload(photo, "image"), upload(sample, "video")]);
      setStatus("Starting preview…");
      const result = await start({ data: { imagePath, videoPath, scene } });
      setJobId(result.jobId);
      setStatus("Generating preview…");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not start preview");
      setStatus("");
    } finally { setBusy(false); }
  }

  return <section className="border-t border-border bg-background py-10 text-foreground">
    <div className="mx-auto max-w-6xl px-5">
      <p className="text-xs font-semibold uppercase text-primary">Colors Studio</p>
      <h2 className="mt-2 text-2xl font-bold">Performance preview</h2>
      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><input ref={photoInput} className="sr-only" type="file" accept="image/jpeg" aria-label="Character photo" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} /><Button variant="outline" className="w-full justify-start" onClick={() => photoInput.current?.click()}><Upload className="mr-2 size-4" /> Character photo</Button><p className="mt-2 truncate text-xs text-muted-foreground">{photo?.name ?? "JPEG portrait"}</p></div>
            <div><input ref={clipInput} className="sr-only" type="file" accept="video/*" aria-label="Performance clip" onChange={(event) => setClip(event.target.files?.[0] ?? null)} /><Button variant="outline" className="w-full justify-start" onClick={() => clipInput.current?.click()}><Film className="mr-2 size-4" /> Performance clip</Button><p className="mt-2 truncate text-xs text-muted-foreground">{clip?.name ?? "Uses three seconds of movement"}</p></div>
          </div>
          <fieldset><legend className="mb-2 text-sm font-medium">Scene</legend><div className="flex gap-2">{(["court", "colors"] as const).map((option) => <Button key={option} variant={scene === option ? "default" : "outline"} onClick={() => setScene(option)}>{option === "court" ? "Basketball court" : "Colors studio"}</Button>)}</div></fieldset>
          <Button disabled={!photo || !clip || !user || busy || !!jobId} onClick={() => void generate()}>{busy || jobId ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Film className="mr-2 size-4" />}Generate preview</Button>
          <p className="text-xs text-muted-foreground">Generates a new three-second interpretation of the clip’s movements; it is not an exact motion transfer. Video generation uses AI credits.</p>
          {status && <p role="status" className="text-sm text-foreground">{status}</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="aspect-[9/16] max-h-[540px] overflow-hidden rounded border border-border bg-card flex items-center justify-center">
          {url ? <video src={url} controls playsInline className="h-full w-full object-contain" /> : <Film className="size-8 text-muted-foreground" />}
        </div>
      </div>
    </div>
  </section>;
}