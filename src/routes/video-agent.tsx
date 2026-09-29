// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import "@/features/creative-studio/aurora.css";
import bg1 from "@/features/creative-studio/assets/aurora-bg-1.jpg";
import bg2 from "@/features/creative-studio/assets/aurora-bg-2.jpg";
import bg3 from "@/features/creative-studio/assets/aurora-bg-3.jpg";
import bg4 from "@/features/creative-studio/assets/aurora-bg-4.jpg";
import bg5 from "@/features/creative-studio/assets/aurora-bg-5.jpg";
import moonAsset from "@/features/creative-studio/assets/aurora-moon.jpg";
import chromeAsset from "@/features/creative-studio/assets/aurora-chrome.jpg";
import courtBg from "@/features/creative-studio/assets/aurora-court.jpg";
import {
  CHAT_MODELS,
  DIRECTOR_MODELS,
  IMAGE_MODELS,
  VIDEO_MODELS,
  modelLabel,
  modelProvider,
  type ModelOption,
  type Provider,
} from "@/features/creative-studio/lib/aurora-models";
import { SKILLS, buildSystemPrompt } from "@/features/creative-studio/lib/aurora-skills";
import { primeSpeech, speak, stopSpeech } from "@/features/creative-studio/lib/aurora-voice";
import { classifySeedanceReferenceError, isLasAssetReference } from "@/features/creative-studio/lib/seedance-reference";
import { StudioNav } from "@/features/creative-studio/components/studio/StudioNav";

export const Route = createFileRoute("/video-agent")({
  head: () => ({
    meta: [
      { title: "Aurora Creative Studio — AI Images & Videos in Seconds" },
      {
        name: "description",
        content:
          "Create AI images and videos in seconds. Seedream, Seedance and Seed models — turn any idea into stunning visuals, no design skills needed.",
      },
      { property: "og:title", content: "Aurora Creative Studio — AI Images & Videos" },
      {
        property: "og:description",
        content:
          "Seedream 5.0 images, Seedance 2.5 video and a creative director in chat. Turn any idea into stunning visuals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type CameraMove = "auto" | "static" | "push" | "orbit" | "track" | "crane" | "handheld";
type MotionLevel = "gentle" | "balanced" | "dynamic";

type Mode = "image" | "video";
type Aspect = "1:1" | "16:9" | "9:16";
type BgTheme = "moon" | "chrome" | "collage" | "court";

interface Creation {
  id: number;
  prompt: string;
  model: string;
  kind: Mode;
  aspect: Aspect;
  status: "pending" | "done" | "error";
  url?: string;
  error?: string;
}

interface ChatMsg {
  role: "u" | "a";
  text: string;
}

const IMAGE_SIZES: Record<Aspect, Record<"2K" | "4K", string>> = {
  "1:1": { "2K": "2048x2048", "4K": "4096x4096" },
  "16:9": { "2K": "2560x1440", "4K": "3840x2160" },
  "9:16": { "2K": "1440x2560", "4K": "2160x3840" },
};

const WELCOME: ChatMsg = {
  role: "a",
  text: "Yo Josh — Aurora here. Tell me the idea and I'll turn it into a shootable, out-the-mud visual. 🎬",
};

const STORE_KEY = "aurora_state_v2";

const DEFAULT_SKILLS = ["cinematic", "content", "prompting"];

interface StoredState {
  mode?: Mode;
  aspect?: Aspect;
  resolution?: "2K" | "4K";
  duration?: number;
  cameraMove?: CameraMove;
  motion?: MotionLevel;
  imageModel?: string;
  videoModel?: string;
  chatModel?: string;
  bg?: BgTheme;
  dirModel?: string;
  creations?: Creation[];
  messages?: ChatMsg[];
  voiceOn?: boolean;
  skills?: string[];
  memory?: string[];
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="9" cy="9" r="1.6" />
      <path d="M21 15.5l-4.5-4.5L6 21.5" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="5" width="14" height="14" rx="5" />
      <path d="M23 8l-6 4 6 4V8z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.4 20.4l17.8-7.6c.8-.4.8-1.5 0-1.9L3.4 3.6c-.7-.3-1.4.2-1.4.9v4.4c0 .5.4.9.9 1l11.3 2.1-11.3 2.1c-.5.1-.9.5-.9 1v4.4c0 .7.7 1.2 1.4.9z" />
    </svg>
  );
}

function SparkMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 6.2L21 10l-5.2 3.4L17 21l-5-3.4L7 21l1.2-7.6L3 10l6.6-1.8z" />
    </svg>
  );
}

async function callApi<T>(provider: Provider, body: unknown, key?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key?.trim() && provider === "ark") headers["x-ark-key"] = key.trim();
  const endpoint = provider === "zenmux" ? "/api/zenmux" : "/api/ark";
  const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.error?.message || json.message || `Request failed (${res.status})`);
  }
  return json as T;
}

const CAMERA_MOVES: { id: CameraMove; label: string; cue: string }[] = [
  { id: "auto", label: "Auto", cue: "" },
  { id: "static", label: "Locked off", cue: "locked-off static camera, no camera movement" },
  { id: "push", label: "Push in", cue: "slow dolly push-in toward the subject" },
  { id: "orbit", label: "Orbit", cue: "smooth orbit around the subject" },
  { id: "track", label: "Tracking", cue: "steady tracking shot following the subject" },
  { id: "crane", label: "Crane", cue: "rising crane shot revealing the space" },
  { id: "handheld", label: "Handheld", cue: "energetic handheld camera, subtle shake" },
];

const MOTION_LEVELS: { id: MotionLevel; label: string; cue: string }[] = [
  { id: "gentle", label: "Gentle", cue: "minimal subject motion, slow and controlled" },
  { id: "balanced", label: "Balanced", cue: "natural subject motion" },
  { id: "dynamic", label: "Dynamic", cue: "high-energy motion, fast action and movement" },
];

function applyMotion(text: string, move: CameraMove, level: MotionLevel) {
  const cues = [
    CAMERA_MOVES.find((c) => c.id === move)?.cue,
    MOTION_LEVELS.find((m) => m.id === level)?.cue,
  ].filter(Boolean);
  if (!cues.length) return text;
  return `${text.trim().replace(/[.\s]+$/, "")}. Camera: ${cues.join("; ")}.`;
}

function Index() {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<Mode>("image");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<Aspect>("1:1");
  const [resolution, setResolution] = useState<"2K" | "4K">("2K");
  const [duration, setDuration] = useState(5);
  const [cameraMove, setCameraMove] = useState<CameraMove>("auto");
  const [motion, setMotion] = useState<MotionLevel>("balanced");
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0]!.id);
  const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0]!.id);
  const [chatModel, setChatModel] = useState(CHAT_MODELS[0]!.id);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [refs, setRefs] = useState<string[]>([]);
  const [refDraft, setRefDraft] = useState("");
  const [referenceVideo, setReferenceVideo] = useState("");
  const [referenceAudio, setReferenceAudio] = useState("");
  const [refOpen, setRefOpen] = useState(false);
  const [referenceError, setReferenceError] = useState("");
  const [creations, setCreations] = useState<Creation[]>([]);
  const [busy, setBusy] = useState(false);
  const [bg, setBg] = useState<BgTheme>("moon");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);
  const [skills, setSkills] = useState<string[]>(DEFAULT_SKILLS);
  const [memory, setMemory] = useState<string[]>([]);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [dirModel, setDirModel] = useState(DIRECTOR_MODELS[0]!.id);
  const [dirMenuOpen, setDirMenuOpen] = useState(false);
  const [dirInput, setDirInput] = useState("");
  const [dirOut, setDirOut] = useState("");
  const [dirBusy, setDirBusy] = useState(false);
  const [dirError, setDirError] = useState("");
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  const MAX_REFS = 30;

  const handleRefFiles = async (files?: FileList | null) => {
    if (!files?.length) return;
    setReferenceError("");
    const picked = Array.from(files);
    const invalid = picked.filter((file) => file.size > 200 * 1024 * 1024);
    if (invalid.length) setReferenceError("That file is too large. Reference media can be up to 200 MB.");
    const usable = picked.filter((file) => file.size <= 200 * 1024 * 1024);
    if (!usable.length) return;
    try {
      for (const file of usable) {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error("sign in");
        const path = `${auth.user.id}/references/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("studio").upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const blob = { url: supabase.storage.from("studio").getPublicUrl(path).data.publicUrl };
        if (file.type.startsWith("video/")) setReferenceVideo(blob.url);
        else if (file.type.startsWith("audio/")) setReferenceAudio(blob.url);
        else if (file.type.startsWith("image/")) setRefs((prev) => [...prev, blob.url].slice(0, MAX_REFS));
      }
    } catch {
      setReferenceError("Aurora couldn’t add that reference. Try the upload again.");
    }
  };

  const addReferenceVideoUrl = (value: string) => {
    setReferenceVideo(value.trim());
    setReferenceError("");
  };

  const addReferenceAudioUrl = (value: string) => {
    setReferenceAudio(value.trim());
    setReferenceError("");
  };

  const addRefUrl = () => {
    const url = refDraft.trim();
    if (!url) return;
    setRefs((prev) => (prev.includes(url) ? prev : [...prev, url].slice(0, MAX_REFS)));
    setRefDraft("");
  };

  const removeRef = (url: string) => setRefs((prev) => prev.filter((r) => r !== url));

  // ---- persistent memory ----
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aurora_settings");
      if (saved) {
        const s = JSON.parse(saved) as { apiKey?: string; sessionId?: string };
        setApiKey(s.apiKey ?? "");
        setSessionId(s.sessionId ?? "");
      }
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as StoredState;
        if (s.mode) setMode(s.mode);
        if (s.aspect) setAspect(s.aspect);
        if (s.resolution) setResolution(s.resolution);
        if (s.duration) setDuration(s.duration);
        if (s.cameraMove) setCameraMove(s.cameraMove);
        if (s.motion) setMotion(s.motion);
        if (s.imageModel) setImageModel(s.imageModel);
        if (s.videoModel) setVideoModel(s.videoModel);
        if (s.chatModel) setChatModel(s.chatModel);
        if (s.bg) setBg(s.bg);
        if (s.dirModel) setDirModel(s.dirModel);
        if (typeof s.voiceOn === "boolean") setVoiceOn(s.voiceOn);
        if (s.skills) setSkills(s.skills);
        if (s.memory?.length) setMemory(s.memory);
        if (s.messages?.length) setMessages(s.messages);
        if (s.creations?.length) {
          const restored = s.creations.map((c) =>
            c.status === "pending"
              ? { ...c, status: "error" as const, error: "Interrupted — generate again." }
              : c,
          );
          setCreations(restored);
          nextId.current = Math.max(...restored.map((c) => c.id)) + 1;
        }
      } else {
        const legacyBg = localStorage.getItem("aurora_bg");
        if (
          legacyBg === "moon" ||
          legacyBg === "chrome" ||
          legacyBg === "collage" ||
          legacyBg === "court"
        )
          setBg(legacyBg);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state: StoredState = {
        mode,
        aspect,
        resolution,
        duration,
        cameraMove,
        motion,
        imageModel,
        videoModel,
        chatModel,
        bg,
        dirModel,
        voiceOn,
        skills,
        memory: memory.slice(-40),
        creations: creations.slice(0, 40),
        messages: messages.slice(-60),
      };
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      // ignore (quota)
    }
  }, [
    hydrated,
    mode,
    aspect,
    resolution,
    duration,
    cameraMove,
    motion,
    imageModel,
    videoModel,
    chatModel,
    bg,
    dirModel,
    voiceOn,
    skills,
    memory,
    creations,
    messages,
  ]);

  useEffect(() => {
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight });
  }, [messages, chatOpen, chatBusy]);

  useEffect(() => {
    if (!modelMenuOpen && !chatMenuOpen && !dirMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".aurora-model-wrap")) {
        setModelMenuOpen(false);
        setChatMenuOpen(false);
        setDirMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [modelMenuOpen, chatMenuOpen, dirMenuOpen]);

  const modelList: ModelOption[] = mode === "image" ? IMAGE_MODELS : VIDEO_MODELS;
  const activeModel = mode === "image" ? imageModel : videoModel;

  const updateCreation = (id: number, patch: Partial<Creation>) => {
    setCreations((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const pickModel = (id: string) => {
    if (mode === "image") setImageModel(id);
    else setVideoModel(id);
    setModelMenuOpen(false);
  };

  const handleGenerate = async (override?: { text?: string; mode?: Mode }) => {
    const text = (override?.text ?? prompt).trim();
    if (!text || busy) return;
    const id = nextId.current++;
    const currentMode = override?.mode ?? mode;
    const currentAspect = aspect;
    const currentList = currentMode === "image" ? IMAGE_MODELS : VIDEO_MODELS;
    const currentModel = currentMode === "image" ? imageModel : videoModel;
    const provider = modelProvider(currentModel, currentList);
    const references = [...refs, ...(refDraft.trim() ? [refDraft.trim()] : [])].slice(0, MAX_REFS);
    const hasVideoReference = Boolean(referenceVideo.trim());
    const hasAudioReference = Boolean(referenceAudio.trim());
    const imageRoles = references.map(() =>
      references.length === 1 && !hasVideoReference && !hasAudioReference
        ? "first_frame" as const
        : "reference_image" as const,
    );
    setReferenceError("");
    setCreations((prev) => [
      {
        id,
        prompt: text,
        model: modelLabel(currentModel, currentList),
        kind: currentMode,
        aspect: currentAspect,
        status: "pending",
      },
      ...prev,
    ]);
    if (!override?.text) setPrompt("");
    setBusy(true);

    try {
      if (currentMode === "image") {
        const data = await callApi<{ data?: { url?: string; b64_json?: string }[] }>(
          provider,
          {
            kind: "image",
            model: currentModel,
            prompt: text,
            size: IMAGE_SIZES[currentAspect][resolution],
            imageUrls: references,
          },
          apiKey,
        );
        const first = data.data?.[0];
        const url =
          first?.url ?? (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : undefined);
        if (!url) throw new Error("No image was returned.");
        updateCreation(id, { status: "done", url });
      } else {
        const task = await callApi<{ id?: string }>(
          provider,
          {
            kind: "video",
            model: currentModel,
            prompt: applyMotion(text, cameraMove, motion),
            cameraFixed: cameraMove === "static",
            ratio: currentAspect,
            duration,
            imageUrls: references,
            imageRoles,
            videoUrl: referenceVideo.trim() || undefined,
            audioUrl: referenceAudio.trim() || undefined,
            resolution: "720p",
            generateAudio: true,
          },
          apiKey,
        );
        if (!task.id) throw new Error("No video task was created.");
        let url: string | undefined;
        for (let i = 0; i < 120; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          const status = await callApi<{
            status?: string;
            content?: { video_url?: string };
            error?: { message?: string };
          }>(provider, { kind: "videoStatus", taskId: task.id }, apiKey);
          if (status.status === "succeeded") {
            url = status.content?.video_url;
            break;
          }
          if (status.status === "failed" || status.status === "cancelled") {
            throw new Error(status.error?.message || "Video generation failed.");
          }
        }
        if (!url) throw new Error("Video is taking too long — try again.");
        updateCreation(id, { status: "done", url });
      }
    } catch (err) {
      const rawError = err instanceof Error ? err.message : "Something went wrong.";
      const referenceFailure = classifySeedanceReferenceError(rawError);
      if (referenceFailure) setReferenceError("This reference needs a quick identity check before Aurora can use it. Choose an authorized reference or use the reference only for motion, framing, or style.");
      updateCreation(id, {
        status: "error",
        error: referenceFailure ? "Aurora needs an authorized reference for this person. Try a different reference or continue without the person's identity." : rawError,
      });
    } finally {
      setBusy(false);
    }
  };

  const streamChat = async (
    model: string,
    convo: { role: string; content: string }[],
    onDelta: (full: string) => void,
  ): Promise<string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey.trim()) headers["x-ark-key"] = apiKey.trim();
    const res = await fetch("/api/canvas/chat-stream", {
      method: "POST",
      headers,
      body: JSON.stringify({
        provider: modelProvider(model, DIRECTOR_MODELS),
        model,
        messages: convo,
      }),
    });
    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(data.error?.message || `Request failed (${res.status})`);
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffered = "";
    let full = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffered += value;
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let parsed: { choices?: { delta?: { content?: string } }[] };
        try {
          parsed = JSON.parse(payload) as typeof parsed;
        } catch {
          continue;
        }
        const piece = parsed.choices?.[0]?.delta?.content;
        if (!piece) continue;
        full += piece;
        onDelta(full);
      }
    }
    return full.trim();
  };

  const runDirector = async (action: "treat" | "film") => {
    const idea = dirInput.trim();
    if (!idea || dirBusy || busy) return;
    setDirError("");
    setDirOut("");
    setDirBusy(true);
    const task =
      action === "film"
        ? "Turn the idea below into ONE cinematic video generation prompt. Reply with the prompt only — a single paragraph under 70 words, naming shot, camera move, lighting, wardrobe and mood. No titles, no lists, no commentary."
        : "Give a tight shootable treatment for the idea below: logline, 3-4 shots with camera moves, lighting and wardrobe notes, and one rollout angle. Keep it under 180 words.";
    try {
      const out = await streamChat(
        dirModel,
        [
          { role: "system", content: `${buildSystemPrompt(skills, memory)}\n\n${task}` },
          { role: "user", content: idea },
        ],
        setDirOut,
      );
      if (!out) throw new Error("The director didn't reply — try again.");
      if (action === "film") {
        setMode("video");
        setPrompt(out);
        await handleGenerate({ text: out, mode: "video" });
      }
    } catch (err) {
      setDirError(err instanceof Error ? err.message : "The director is unavailable.");
    } finally {
      setDirBusy(false);
    }
  };

  const sayIt = async (text: string) => {
    if (!text.trim()) return;
    setVoiceError("");
    setSpeaking(true);
    try {
      await speak(text);
    } catch (error) {
      setVoiceError(error instanceof Error ? error.message : "Voice playback failed.");
    } finally {
      setSpeaking(false);
    }
  };

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    stopSpeech();
    // Unlock audio while we're still inside the user's click/keypress.
    if (voiceOn) primeSpeech();
    const history = [...messages, { role: "u" as const, text }];
    setMessages(history);
    setChatInput("");
    setChatBusy(true);

    const note = text.match(/^\s*(?:remember|note)(?:\s+that)?[:,]?\s+(.{3,240})$/i)?.[1];
    if (note) setMemory((prev) => [...prev.filter((m) => m !== note.trim()), note.trim()]);

    const systemPrompt = buildSystemPrompt(skills, note ? [...memory, note.trim()] : memory);
    const convo = [
      { role: "system", content: systemPrompt },
      ...history.slice(-24).map((m) => ({
        role: m.role === "u" ? "user" : "assistant",
        content: m.text,
      })),
    ];

    try {
      if (chatModel === "agent") {
        const res = await fetch("/api/canvas/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sessionId: sessionId.trim() || undefined }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          reply?: string;
          error?: { message?: string };
        };
        if (!res.ok) throw new Error(data.error?.message || `Request failed (${res.status})`);
        const reply = data.reply?.trim() || "I didn't catch that — try again?";
        setMessages((prev) => [...prev, { role: "a", text: reply }]);
        setChatBusy(false);
        if (voiceOn) void sayIt(reply);
        return;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey.trim()) headers["x-ark-key"] = apiKey.trim();
      const res = await fetch("/api/canvas/chat-stream", {
        method: "POST",
        headers,
        body: JSON.stringify({
          provider: modelProvider(chatModel, CHAT_MODELS),
          model: chatModel,
          messages: convo,
        }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(data.error?.message || `Request failed (${res.status})`);
      }

      setMessages((prev) => [...prev, { role: "a", text: "" }]);
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffered = "";
      let full = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffered += value;
        const lines = buffered.split("\n");
        buffered = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          let parsed: { choices?: { delta?: { content?: string } }[] };
          try {
            parsed = JSON.parse(payload) as typeof parsed;
          } catch {
            continue;
          }
          const piece = parsed.choices?.[0]?.delta?.content;
          if (!piece) continue;
          full += piece;
          const snapshot = full;
          setMessages((prev) =>
            prev.map((m, i) => (i === prev.length - 1 && m.role === "a" ? { ...m, text: snapshot } : m)),
          );
        }
      }
      if (!full.trim()) {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.role === "a"
              ? { ...m, text: "I didn't catch that — try again?" }
              : m,
          ),
        );
      } else if (voiceOn) {
        void sayIt(full);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "a", text: err instanceof Error ? err.message : "Something went wrong." },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem("aurora_settings", JSON.stringify({ apiKey, sessionId }));
    } catch {
      // ignore
    }
    setSettingsOpen(false);
  };

  const clearHistory = () => {
    setCreations([]);
    setMessages([WELCOME]);
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      // ignore
    }
  };

  const collageCols: string[][] = [
    [bg1, bg4],
    [bg2, bg5],
    [bg3, bg1],
  ];

  const singleBg =
    bg === "moon" ? moonAsset : bg === "court" ? courtBg : chromeAsset;

  return (
    <div className="aurora-body">
      <div className="aurora-bg-layer">
        {bg === "collage" ? (
          <div className="aurora-collage">
            {collageCols.map((col, i) => (
              <div className={`aurora-collage-col c${i + 1}`} key={i}>
                {col.map((src, j) => (
                  <img
                    key={j}
                    src={src}
                    alt=""
                    width={768}
                    height={1024}
                    loading={i === 1 && j === 0 ? "eager" : "lazy"}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="aurora-bg-single">
            <img src={singleBg} alt="" />
          </div>
        )}
        <div className="aurora-bg-overlay" />
      </div>

      <div className="aurora-logo-top">
        <div className="aurora-logo-mark">A</div>
        Aurora
        <div className="aurora-bg-switch" role="group" aria-label="Background">
          {(["court", "moon", "chrome", "collage"] as BgTheme[]).map((t) => (
            <button
              key={t}
              className={`aurora-bg-btn ${bg === t ? "active" : ""}`}
              onClick={() => setBg(t)}
              aria-pressed={bg === t}
            >
              {t === "court"
                ? "Court"
                : t === "moon"
                  ? "Moon"
                  : t === "chrome"
                    ? "Chrome"
                    : "Collage"}
            </button>
          ))}
        </div>
      </div>

      <button
        className="aurora-settings-fab"
        aria-label="Settings"
        onClick={() => setSettingsOpen(true)}
      >
        ⚙️
      </button>

      <StudioNav />

      <div className="aurora-wrap">

        <section className="aurora-hero">
          <div className="aurora-top-badge">
            <span className="new-pill">New</span>
            Seedance 2.5 &amp; Seedream 5.0 are live
          </div>

          <h1 className="aurora-h1">Create AI Images &amp; Videos in Seconds</h1>

          <p className="aurora-subhead">
            Seedream and Seedance models, plus a creative director in chat. Turn any idea into
            stunning visuals — no design skills needed.
          </p>

          <div className="aurora-mode-switch">
            <button
              className={`aurora-mode-btn ${mode === "image" ? "active" : ""}`}
              onClick={() => {
                setMode("image");
                setModelMenuOpen(false);
              }}
            >
              <ImageIcon />
              Image
            </button>
            <button
              className={`aurora-mode-btn ${mode === "video" ? "active" : ""}`}
              onClick={() => {
                setMode("video");
                setModelMenuOpen(false);
              }}
            >
              <VideoIcon />
              Video
            </button>
          </div>

          <div className="aurora-director">
            <div className="aurora-dir-hd">
              <span className="aurora-dir-title">🎥 Creative Director</span>
              <div className="aurora-model-wrap">
                <button
                  className="aurora-dir-model"
                  onClick={() => setDirMenuOpen((v) => !v)}
                  aria-expanded={dirMenuOpen}
                >
                  {modelLabel(dirModel, DIRECTOR_MODELS)} <span className="chev">▼</span>
                </button>
                {dirMenuOpen && (
                  <div className="aurora-menu" role="listbox">
                    {DIRECTOR_MODELS.map((m) => (
                      <button
                        key={m.id}
                        className={`aurora-menu-item ${m.id === dirModel ? "active" : ""}`}
                        onClick={() => {
                          setDirModel(m.id);
                          setDirMenuOpen(false);
                        }}
                        role="option"
                        aria-selected={m.id === dirModel}
                      >
                        <span>{m.label}</span>
                        <small>{m.note ?? m.vendor}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <textarea
              className="aurora-dir-input"
              placeholder="Describe a scene — “courtside tunnel walk, chrome chains, rain outside” — and film it"
              value={dirInput}
              onChange={(e) => setDirInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void runDirector("film");
                }
              }}
            />
            <div className="aurora-dir-actions">
              <button
                className="aurora-btn-p"
                disabled={!dirInput.trim() || dirBusy || busy}
                onClick={() => void runDirector("film")}
              >
                {dirBusy || busy ? "Filming…" : "Film this scene"}
              </button>
              <button
                className="aurora-btn-s"
                disabled={!dirInput.trim() || dirBusy}
                onClick={() => void runDirector("treat")}
              >
                Treatment
              </button>
              {dirOut.trim() && !dirBusy && (
                <button
                  className="aurora-btn-s"
                  onClick={() => {
                    setPrompt(dirOut.trim());
                    setDirOut("");
                  }}
                >
                  Use as prompt
                </button>
              )}
            </div>
            {dirError && (
              <p role="alert" className="aurora-voice-error">
                {dirError}
              </p>
            )}
            {dirOut && <div className="aurora-dir-out">{dirOut}</div>}
          </div>

          <div className="aurora-prompt-card">
            <div className="aurora-prompt-top">
              <button
                className={`aurora-add-btn ${refs.length ? "has-ref" : ""}`}
                aria-label="Add reference"
                title="Add a reference image, video, or audio"
                onClick={() => setRefOpen((v) => !v)}
              >
                {refs[0] ? <img src={refs[0]} alt="Reference" /> : "+"}
                {refs.length > 1 && <span className="aurora-ref-count">{refs.length}</span>}
              </button>
              <textarea
                className="aurora-prompt-input"
                placeholder={
                  mode === "image"
                    ? "What should Aurora create?"
                    : "What should Aurora create?"
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleGenerate();
                  }
                }}
              />
            </div>

            {refOpen && (
              <div className="aurora-ref-row">
                {refs.length > 0 && (
                  <div className="aurora-ref-strip">
                    {refs.map((r) => (
                      <span className="aurora-ref-chip" key={r}>
                        <img src={r} alt="Reference" />
                        <button
                          aria-label="Remove reference"
                          onClick={() => removeRef(r)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={refDraft}
                  onChange={(e) => setRefDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRefUrl();
                    }
                  }}
                  placeholder="Paste an image link"
                  aria-label="Reference image link"
                />
                <input
                  type="text"
                  value={referenceVideo}
                  onChange={(e) => addReferenceVideoUrl(e.target.value)}
                  placeholder="Paste a reference video link"
                  aria-label="Reference video link"
                />
                <input
                  type="text"
                  value={referenceAudio}
                  onChange={(e) => addReferenceAudioUrl(e.target.value)}
                  placeholder="Optional audio link"
                  aria-label="Reference audio link"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/mp4,video/quicktime,audio/mpeg,audio/wav"
                  multiple
                  hidden
                  onChange={(e) => {
                    void handleRefFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button className="aurora-ref-upload" onClick={() => fileRef.current?.click()}>
                  Upload reference
                </button>
                {referenceVideo && !isLasAssetReference(referenceVideo) && !/^https?:\/\//i.test(referenceVideo) && (
                  <small>Use a public video link for video references.</small>
                )}
                {referenceError && (
                  <div className="aurora-ref-error" role="alert">{referenceError}</div>
                )}
                {refs.length > 0 && (
                  <button className="aurora-ref-clear" onClick={() => setRefs([])}>
                    Clear all
                  </button>
                )}
              </div>
            )}

            <div className="aurora-controls">
              <div className="aurora-model-wrap">
                <button
                  className="aurora-model-pill"
                  onClick={() => setModelMenuOpen((v) => !v)}
                  aria-expanded={modelMenuOpen}
                >
                  <span className="aurora-model-logo">
                    <SparkMark />
                  </span>
                  <span className="name">{modelLabel(activeModel, modelList)}</span>
                  <span className="chev">▼</span>
                </button>
                {modelMenuOpen && (
                  <div className="aurora-menu" role="listbox">
                    {modelList.map((m) => (
                      <button
                        key={m.id}
                        className={`aurora-menu-item ${m.id === activeModel ? "active" : ""}`}
                        onClick={() => pickModel(m.id)}
                        role="option"
                        aria-selected={m.id === activeModel}
                      >
                        <span>{m.label}</span>
                        <small>{m.note ?? m.vendor}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="aurora-seg-control">
                {(["1:1", "16:9", "9:16"] as Aspect[]).map((a) => (
                  <button
                    key={a}
                    className={`aurora-seg-btn ${aspect === a ? "active" : ""}`}
                    onClick={() => setAspect(a)}
                  >
                    {a === "1:1" && <span className="aurora-square-icon" />}
                    {a}
                  </button>
                ))}
              </div>

              {mode === "image" ? (
                <div className="aurora-seg-control">
                  {(["2K", "4K"] as const).map((r) => (
                    <button
                      key={r}
                      className={`aurora-seg-btn ${resolution === r ? "active" : ""}`}
                      onClick={() => setResolution(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="aurora-seg-control">
                  {[5, 10].map((d) => (
                    <button
                      key={d}
                      className={`aurora-seg-btn ${duration === d ? "active" : ""}`}
                      onClick={() => setDuration(d)}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              )}

              {mode === "video" && (
                <div className="aurora-motion-row">
                  <div className="aurora-seg-control aurora-motion-seg">
                    {CAMERA_MOVES.map((c) => (
                      <button
                        key={c.id}
                        className={`aurora-seg-btn ${cameraMove === c.id ? "active" : ""}`}
                        onClick={() => setCameraMove(c.id)}
                        title={c.cue || "Let Seedance choose the camera move"}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <div className="aurora-seg-control aurora-motion-seg">
                    {MOTION_LEVELS.map((m) => (
                      <button
                        key={m.id}
                        className={`aurora-seg-btn ${motion === m.id ? "active" : ""}`}
                        onClick={() => setMotion(m.id)}
                        title={m.cue}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="aurora-send-btn"
                onClick={() => void handleGenerate()}
                disabled={!prompt.trim() || busy}
                aria-label="Generate"
              >
                <SendIcon />
              </button>
            </div>
          </div>


          <div className="aurora-stats-row">
            <div className="aurora-stat-item">
              <div className="aurora-stat-num">{IMAGE_MODELS.length}</div>
              <div className="aurora-stat-label">Image models</div>
            </div>
            <div className="aurora-stat-item">
              <div className="aurora-stat-num">{VIDEO_MODELS.length}</div>
              <div className="aurora-stat-label">Video models</div>
            </div>
            <div className="aurora-stat-item">
              <div className="aurora-stat-num">{CHAT_MODELS.length - 1}</div>
              <div className="aurora-stat-label">Chat models</div>
            </div>
          </div>
        </section>

        <section className="aurora-gallery">
          <div className="aurora-gallery-hd">
            <h2>Your Creations</h2>
            {creations.length > 0 && (
              <button className="aurora-btn-s" onClick={clearHistory}>
                Clear history
              </button>
            )}
          </div>
          {creations.length === 0 ? (
            <div className="aurora-empty">
              <div className="spark">✨</div>
              <h3>✨ Your first creation</h3>
              <p>Generate something amazing to see it here — it stays saved on this device</p>
            </div>
          ) : (
            <div className="aurora-gallery-grid">
              {creations.map((c) => (
                <div className="aurora-g-card" key={c.id}>
                  <div className="aurora-g-thumb">
                    {c.status === "pending" && <span className="aurora-spinner" />}
                    {c.status === "error" && <span className="aurora-g-error">{c.error}</span>}
                    {c.status === "done" && c.url && c.kind === "image" && (
                      <img src={c.url} alt={c.prompt} loading="lazy" />
                    )}
                    {c.status === "done" && c.url && c.kind === "video" && (
                      <video src={c.url} controls playsInline preload="metadata" />
                    )}
                  </div>
                  <div className="aurora-g-info">
                    <div className="aurora-g-model">
                      {c.kind === "video" ? "🎬" : "🖼"} {c.model} · {c.aspect}
                    </div>
                    <div className="aurora-g-prompt">{c.prompt}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {!chatOpen && (
        <button className="aurora-chat-fab" aria-label="Open chat" onClick={() => setChatOpen(true)}>
          💬
        </button>
      )}

      {chatOpen && (
        <div className="aurora-chat-panel">
          <div className="aurora-chat-hd">
            <div className="aurora-model-wrap">
              <button
                className="aurora-chat-model"
                onClick={() => setChatMenuOpen((v) => !v)}
                aria-expanded={chatMenuOpen}
              >
                🎬 {modelLabel(chatModel, CHAT_MODELS)} <span className="chev">▼</span>
              </button>
              {chatMenuOpen && (
                <div className="aurora-menu up" role="listbox">
                  {CHAT_MODELS.map((m) => (
                    <button
                      key={m.id}
                      className={`aurora-menu-item ${m.id === chatModel ? "active" : ""}`}
                      onClick={() => {
                        setChatModel(m.id);
                        setChatMenuOpen(false);
                      }}
                      role="option"
                      aria-selected={m.id === chatModel}
                    >
                      <span>{m.label}</span>
                      <small>{m.note ?? m.vendor}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className={`aurora-voice-toggle ${voiceOn ? "active" : ""}`}
              aria-pressed={voiceOn}
              aria-label={voiceOn ? "Turn voice replies off" : "Turn voice replies on"}
              title={voiceOn ? "Voice replies on" : "Voice replies off"}
              onClick={() => {
                if (voiceOn) {
                  stopSpeech();
                  setSpeaking(false);
                  setVoiceOn(false);
                } else {
                  primeSpeech();
                  setVoiceOn(true);
                }
              }}
            >
              {voiceOn ? "🔊" : "🔇"}
            </button>
            {speaking && (
              <button
                className="aurora-voice-toggle"
                aria-label="Stop speaking"
                title="Stop speaking"
                onClick={() => {
                  stopSpeech();
                  setSpeaking(false);
                }}
              >
                ⏹
              </button>
            )}
            <button
              className="aurora-chat-close"
              aria-label="Close chat"
              onClick={() => setChatOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="aurora-chat-body" ref={chatBodyRef}>
            {messages.map((m, i) => (
              <div className={`aurora-cm ${m.role}`} key={i}>
                {m.text}
                {m.role === "a" && m.text.trim() && (
                  <button
                    className="aurora-cm-speak"
                    aria-label="Play this reply"
                    title="Play this reply"
                    onClick={() => {
                      primeSpeech();
                      void sayIt(m.text);
                    }}
                  >
                    🔈
                  </button>
                )}
              </div>
            ))}
            {chatBusy && <div className="aurora-cm a aurora-typing">Thinking…</div>}
          </div>
          {voiceError && <p role="alert" className="aurora-voice-error">{voiceError}</p>}
          <div className="aurora-chat-input-row">
            <input
              placeholder="Ask for a creative direction…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSendChat();
              }}
            />
            <button onClick={() => void handleSendChat()} disabled={chatBusy || !chatInput.trim()}>
              Send
            </button>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="aurora-modal" onClick={() => setSettingsOpen(false)}>
          <div className="aurora-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className="aurora-fld">
              <label htmlFor="aurora-api-key">ARK API Key (optional)</label>
              <input
                id="aurora-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Leave empty to use the built-in key"
              />
            </div>
            <div className="aurora-fld">
              <label htmlFor="aurora-session-id">Session ID</label>
              <input
                id="aurora-session-id"
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Optional — override the creative director session"
              />
            </div>
            <div className="aurora-fld">
              <label>Voice replies</label>
              <button
                className={`aurora-toggle-row ${voiceOn ? "on" : ""}`}
                aria-pressed={voiceOn}
                onClick={() => {
                  if (voiceOn) {
                    stopSpeech();
                    setSpeaking(false);
                    setVoiceOn(false);
                  } else {
                    primeSpeech();
                    setVoiceOn(true);
                  }
                }}
              >
                <span>{voiceOn ? "🔊 Aurora speaks its replies" : "🔇 Voice replies are off"}</span>
                <span className="aurora-toggle-dot" />
              </button>
            </div>

            <div className="aurora-fld">
              <label>Skills</label>
              <div className="aurora-skill-list">
                {SKILLS.map((s) => {
                  const on = skills.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      className={`aurora-skill-chip ${on ? "on" : ""}`}
                      aria-pressed={on}
                      onClick={() =>
                        setSkills((prev) =>
                          on ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                        )
                      }
                    >
                      <strong>{s.label}</strong>
                      <small>{s.blurb}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="aurora-fld">
              <label htmlFor="aurora-memory">Memory</label>
              <div className="aurora-mem-row">
                <input
                  id="aurora-memory"
                  type="text"
                  value={memoryDraft}
                  onChange={(e) => setMemoryDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = memoryDraft.trim();
                      if (!v) return;
                      setMemory((prev) => [...prev.filter((m) => m !== v), v]);
                      setMemoryDraft("");
                    }
                  }}
                  placeholder="Add something Aurora should always remember"
                />
                <button
                  className="aurora-btn-s"
                  onClick={() => {
                    const v = memoryDraft.trim();
                    if (!v) return;
                    setMemory((prev) => [...prev.filter((m) => m !== v), v]);
                    setMemoryDraft("");
                  }}
                >
                  Add
                </button>
              </div>
              {memory.length === 0 ? (
                <p className="aurora-mem-empty">
                  Nothing saved yet — in chat you can also say “Remember …”.
                </p>
              ) : (
                <ul className="aurora-mem-list">
                  {memory.map((m) => (
                    <li key={m}>
                      <span>{m}</span>
                      <button
                        aria-label="Forget this"
                        onClick={() => setMemory((prev) => prev.filter((x) => x !== m))}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="aurora-m-actions">
              <button className="aurora-btn-s" onClick={() => setSettingsOpen(false)}>
                Cancel
              </button>
              <button className="aurora-btn-p" onClick={saveSettings}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
