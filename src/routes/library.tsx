import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "My Video Library — Aurora" },
      { name: "description", content: "Upload and watch your own music videos in your private Aurora library." },
      { property: "og:title", content: "My Video Library — Aurora" },
      { property: "og:description", content: "Your private space for your music videos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LibraryPage,
});

type Item = { name: string; path: string; url: string };

function LibraryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const folder = user ? `${user.id}/library` : "";

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error: e } = await supabase.storage.from("studio").list(folder, { sortBy: { column: "created_at", order: "desc" } });
    if (e) return setError(e.message);
    const files = (data ?? []).filter((f) => f.id);
    const signed = await Promise.all(files.map(async (f) => {
      const path = `${folder}/${f.name}`;
      const { data: s } = await supabase.storage.from("studio").createSignedUrl(path, 3600);
      return { name: f.name.replace(/^\d+-/, ""), path, url: s?.signedUrl ?? "" };
    }));
    setItems(signed);
  }, [user, folder]);

  useEffect(() => { void load(); }, [load]);

  async function onUpload(files: FileList | null) {
    if (!files || !user) return;
    setBusy(true); setError(null);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("video/") && !/\.(mov|mp4|webm|m4v)$/i.test(file.name)) continue;
        const safe = file.name.replace(/[^a-z0-9._-]/gi, "_");
        const { error: e } = await supabase.storage.from("studio").upload(`${folder}/${Date.now()}-${safe}`, file, { contentType: file.type || "video/mp4" });
        if (e) throw new Error(e.message);
      }
      await load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  async function remove(path: string) {
    await supabase.storage.from("studio").remove([path]);
    await load();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">My Video Library</h1>
            <p className="text-sm text-muted-foreground">Only you can see the videos you upload here.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/video-agent/music-video" className="text-sm text-primary">Make a music video →</Link>
            <label className="inline-flex">
              <input type="file" accept="video/*,.mov" multiple hidden onChange={(e) => onUpload(e.target.files)} disabled={!user || busy} />
              <Button asChild disabled={!user || busy}><span>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload video</span></Button>
            </label>
          </div>
        </header>
        {!user && <p className="rounded-lg border border-border p-4 text-sm">Sign in to see your library.</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {user && items.length === 0 && !busy && <p className="text-sm text-muted-foreground">No videos yet — upload your first music video.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.path} className="space-y-2 rounded-xl border border-border bg-card p-3">
              <video src={it.url} controls playsInline className="w-full rounded-md bg-muted" />
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{it.name}</span>
                <button onClick={() => remove(it.path)} aria-label={`Delete ${it.name}`} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
