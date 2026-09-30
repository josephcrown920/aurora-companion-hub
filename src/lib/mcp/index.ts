import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listGenerations from "./tools/list-generations";
import listComfyApps from "./tools/list-comfy-apps";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "aurora-setup-guide",
  title: "Aurora Setup Guide",
  version: "0.1.0",
  instructions:
    "Tools for Aurora Studio. Use `list_my_generations` to browse the user's images and videos, and `list_comfy_apps` to see their ComfyUI workflow apps.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listGenerations, listComfyApps],
});
