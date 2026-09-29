import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE = "https://ai.gateway.lovable.dev/v1/videos";
const MODEL = "google/gemini-omni-1.1-flash";
const table = () => supabaseAdmin.from("colors_gateway_previews" as never) as any;

async function gateway(path: string, key: string, init?: RequestInit) {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch", ...init?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(error?.message ?? `Video request failed (${response.status})`);
  }
  return response;
}

async function media(path: string, mime: string, maxBytes: number) {
  const { data, error } = await supabaseAdmin.storage.from("studio").download(path);
  if (error || !data) throw new Error(error?.message ?? "Could not read uploaded media");
  if (data.size > maxBytes) throw new Error("Media is too large for a preview");
  return { data: Buffer.from(await data.arrayBuffer()).toString("base64"), mime_type: mime };
}

function ownPath(path: string, userId: string) {
  if (!path.startsWith(`${userId}/`) || path.includes("..") || path.includes("%")) throw new Error("Upload your own media first");
}

export async function createColorsPreview(userId: string, imagePath: string, videoPath: string, scene: "colors" | "court") {
  ownPath(imagePath, userId);
  ownPath(videoPath, userId);
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI video generation is not configured");
  const image = await media(imagePath, "image/jpeg", 12 * 1024 * 1024);
  const video = await media(videoPath, "video/webm", 8 * 1024 * 1024);
  const place = scene === "court"
    ? "a brightly lit indoor basketball court with hardwood floor, hoops and clear court markings"
    : "a seamless teal performance studio with a suspended microphone";
  const prompt = `[# Sources <IMAGE_REF_0>@Image1, <VIDEO_REF_0>@Video1] Use Image1 as the identity and wardrobe reference for the performer. Use Video1 only as a short gesture and movement reference, not as the person or scene to edit. Create a new vertical 9:16 three-second performance preview featuring the person from Image1 in ${place}. Follow the broad rhythm, hand gestures and body movement from Video1 while preserving the photographed person's face, hair, clothes, and proportions. Locked-off medium shot, one continuous take, no scene cuts. End on a held performance pose. Audio: quiet court room tone only; no dialogue, no music, no subtitles or on-screen words. This is a new interpretation of the reference movement, not a frame-perfect transfer.`;
  const response = await gateway("", key, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input: [{ type: "text", text: prompt }, { type: "image", ...image }, { type: "video", ...video }], response_format: { type: "video", resolution: "360p", duration: "3s" } }),
  });
  const job = await response.json() as { id?: string; status?: string };
  if (!job.id) throw new Error("Video service did not return a job");
  const { error } = await table().insert({ user_id: userId, gateway_job_id: job.id, image_path: imagePath, video_path: videoPath, scene });
  if (error) throw new Error(error.message);
  return { jobId: job.id, status: job.status ?? "queued" };
}

export async function readColorsPreview(userId: string, jobId: string) {
  const { data: row, error } = await table().select("id, gateway_job_id, result_path").eq("user_id", userId).eq("gateway_job_id", jobId).maybeSingle();
  if (error || !row) throw new Error("Preview not found");
  if (row.result_path) {
    const { data, error: signError } = await supabaseAdmin.storage.from("studio").createSignedUrl(row.result_path, 3600);
    if (signError || !data) throw new Error("Could not load saved preview");
    return { status: "completed", url: data.signedUrl, progress: 100 };
  }
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI video generation is not configured");
  const job = await (await gateway(`/${encodeURIComponent(jobId)}`, key)).json() as { status: string; progress?: number; error?: { message?: string } };
  if (job.status === "failed") return { status: "failed", error: job.error?.message ?? "The video could not be generated", progress: job.progress ?? 0 };
  if (job.status !== "completed") return { status: job.status, progress: job.progress ?? 0 };
  const path = `${userId}/colors-previews/${row.id}.mp4`;
  const { data: existing } = await supabaseAdmin.storage.from("studio").info(path);
  if (!existing) {
    const file = await (await gateway(`/${encodeURIComponent(jobId)}/content`, key)).arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage.from("studio").upload(path, file, { contentType: "video/mp4", upsert: false });
    if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) throw new Error(uploadError.message);
  }
  await table().update({ result_path: path }).eq("id", row.id).eq("user_id", userId);
  const { data, error: signError } = await supabaseAdmin.storage.from("studio").createSignedUrl(path, 3600);
  if (signError || !data) throw new Error("Could not load completed preview");
  return { status: "completed", url: data.signedUrl, progress: 100 };
}