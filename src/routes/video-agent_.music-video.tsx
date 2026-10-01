import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Music, Upload, Film, Scissors, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { pollColorsGatewayPreview, startMusicScene } from "@/lib/colors-gateway.functions";

export const Route = createFileRoute("/video-agent_/music-video")({
  head: () => ({
    meta: [
      { title: "Music Video Builder — Aurora Video Agent" },
      { name: "description", content: "Upload a song, set your performer, write a brief and generate music video scenes you can edit on the timeline." },
      { property: "og:title", content: "Music Video Builder — Aurora Video Agent" },
      { property: "og:description", content: "Song + performer + brief → generated music video scenes, editable frame by frame." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MusicVideoPage,
});

type Scene = { jobId: string; status: string; progress: number; url?: string; error?: string };
const SCENE_SECONDS = 3;

function MusicVideoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const start = useServerFn(startMusicScene);
  const poll = useServerFn(pollColorsGatewayPreview);
  const [song, setSong] = useState<{ path: string; url: string; name: string } | null>(null);
  const [performer, setPerformer] = useState<{ path: string; url: string; mime: string } | null>(null);
  const [brief, setBrief] = useState("");
  const [count, setCount] = useState(3);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File, folder: string) {
    if (!user) throw new Error("Sign in first");
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
    const { error: e } = await supabase.storage.from("studio").upload(path, file, { contentType: file.type || undefined });
    if (e) throw new Error(e.message);
    const { data } = await supabase.storage.from("studio").createSignedUrl(path, 3600 * 24);
    return { path, url: data?.signedUrl ?? "" };
  }

  async function onSong(file?: File) {
    if (!file) return;
    setError(null); setBusy("song");
    try { const r = await upload(file, "music-video/songs"); setSong({ ...r, name: file.name }); }
    catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }
  async function onPerformer(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Use a JPG, PNG or WebP photo");
    setError(null); setBusy("performer");
    try { const r = await upload(file, "music-video/performers"); setPerformer({ ...r, mime: file.type }); }
    catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }

  async function generate() {
    if (!performer || brief.trim().length < 10) return setError("Add a performer photo and a brief (10+ characters)");
    setError(null); setBusy("generate"); setScenes([]);
    try {
      const next: Scene[] = [];
      for (let i = 0; i < count; i++) {
        const r = await start({ data: { imagePath: performer.path, imageMime: performer.mime as "image/jpeg", brief: brief.trim(), sceneIndex: i, sceneCount: count } });
        next.push({ jobId: r.jobId, status: r.status, progress: 0 });
        setScenes([...next]);
      }
    } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }

  useEffect(() => {
    if (!scenes.some((s) => s.status !== "completed" && s.status !== "failed")) return;
    const t = setInterval(async () => {
      const updated = await Promise.all(scenes.map(async (s) => {
        if (s.status === "completed" || s.status === "failed") return s;
        try { return { ...s, ...(await poll({ data: { jobId: s.jobId } })) } as Scene; } catch { return s; }
      }));
      setScenes(updated);
    }, 8000);
    return () => clearInterval(t);
  }, [scenes, poll]);

  const ready = scenes.filter((s) => s.url);
  function sendToTimeline() {
    const items = ready.map((s, i) => ({ name: `Scene ${i + 1}`, src: s.url!, kind: "video", start: i * SCENE_SECONDS, duration: SCENE_SECONDS }));
    if (song) items.push({ name: song.name, src: song.url, kind: "audio", start: 0, duration: Math.max(ready.length * SCENE_SECONDS, 5) });
    localStorage.setItem("aurora_pending_imports", JSON.stringify(items));
    navigate({ to: "/video-agent/timeline" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link to="/video-agent" className="text-xs uppercase tracking-widest text-muted-foreground">← Video Agent</Link>
            <h1 className="text-3xl font-semibold">Music Video Builder</h1>
            <p className="text-sm text-muted-foreground">Song → performer → brief → scenes → edit on the timeline.</p>
          </div>
          <Link to="/library" className="inline-flex items-center gap-2 text-sm text-primary"><Library className="h-4 w-4" /> My video library</Link>
        </header>
        {!user && <p className="rounded-lg border border-border p-4 text-sm">Sign in to build a music video.</p>}

        <section className="grid gap-4 md:grid-cols-2">
          <Step n={1} title="Upload your song" icon={<Music className="h-4 w-4" />}>
            <input type="file" accept="audio/*" onChange={(e) => onSong(e.target.files?.[0])} disabled={!user || !!busy} />
            {busy === "song" && <Loader2 className="h-4 w-4 animate-spin" />}
            {song && <audio src={song.url} controls className="w-full" />}
          </Step>
          <Step n={2} title="Performer reference" icon={<Upload className="h-4 w-4" />}>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onPerformer(e.target.files?.[0])} disabled={!user || !!busy} />
            {busy === "performer" && <Loader2 className="h-4 w-4 animate-spin" />}
            {performer && <img src={performer.url} alt="Performer reference" className="h-40 rounded-md object-cover" />}
          </Step>
        </section>

        <Step n={3} title="Creative brief" icon={<Film className="h-4 w-4" />}>
          <textarea rows={4} className="w-full rounded-md border border-input bg-background p-3 text-sm" placeholder="e.g. Sunny 1950s seaside town, pastel outfits, friends dancing on the boardwalk, golden hour…" value={brief} onChange={(e) => setBrief(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">Scenes
            <select className="rounded-md border border-input bg-background p-1" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-muted-foreground">({SCENE_SECONDS}s each, uses AI credits)</span>
          </label>
        </Step>

        <Step n={4} title="Generate & preview" icon={<Film className="h-4 w-4" />}>
          <Button onClick={generate} disabled={!user || !!busy || !performer}>
            {busy === "generate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Generate scenes
          </Button>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {scenes.map((s, i) => (
              <div key={s.jobId} className="space-y-1 rounded-md border border-border p-2 text-xs">
                <div>Scene {i + 1} · {s.status}{s.status !== "completed" && s.status !== "failed" ? ` ${Math.round(s.progress)}%` : ""}</div>
                {s.url ? <video src={s.url} controls playsInline className="w-full rounded" /> : s.error ? <p className="text-destructive">{s.error}</p> : <div className="flex aspect-[9/16] items-center justify-center rounded bg-muted"><Loader2 className="h-4 w-4 animate-spin" /></div>}
              </div>
            ))}
          </div>
          {ready.length > 0 && (
            <Button variant="secondary" onClick={sendToTimeline}><Scissors className="mr-2 h-4 w-4" /> Edit in Agent Editor timeline</Button>
          )}
        </Step>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </main>
    </div>
  );
}

function Step({ n, title, icon, children }: { n: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium">{icon}<span className="text-muted-foreground">{n}.</span> {title}</div>
      {children}
    </div>
  );
}
