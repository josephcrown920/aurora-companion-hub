import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/library/$videoId")({
  head: () => ({ meta: [
    { title: "Music Video Scene — Aurora Library" },
    { name: "description", content: "Watch your private music video scene in Aurora." },
    { property: "og:title", content: "Music Video Scene — Aurora Library" },
    { property: "og:description", content: "Watch your private music video scene in Aurora." },
    { property: "og:type", content: "video.other" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: VideoPage,
});

function VideoPage() {
  const { videoId } = Route.useParams();
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("Loading scene…");
  useEffect(() => {
    if (!user) { setMessage("Sign in to watch your video."); return; }
    if (!/^[0-9a-f-]{36}$/i.test(videoId)) { setMessage("Video not found."); return; }
    let cancelled = false;
    const path = `${user.id}/music-video/scenes/${videoId}.mp4`;
    void supabase.storage.from("studio").createSignedUrl(path, 3600).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data?.signedUrl) setMessage("This scene is not in your library.");
      else setUrl(data.signedUrl);
    });
    return () => { cancelled = true; };
  }, [user, videoId]);
  return <main className="min-h-screen bg-background px-5 py-8 text-foreground"><div className="mx-auto max-w-4xl space-y-5"><Link to="/library" className="text-sm text-primary">← My Video Library</Link><h1 className="text-2xl font-semibold">Music video scene</h1>{url ? <video src={url} controls playsInline className="mx-auto max-h-[75vh] w-full bg-muted object-contain" /> : <p className="text-muted-foreground">{message}</p>}<Link to="/video-agent/timeline" className="block text-sm text-primary">Open Agent Editor →</Link></div></main>;
}