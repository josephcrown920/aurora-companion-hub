import { createFileRoute } from "@tanstack/react-router";

const ARK_SESSIONS = "https://ark.ap-southeast.bytepluses.com/api/v3/sessions";

interface ArkEvent {
  id: string;
  type: string;
  content?: { type: string; text?: string; url?: string; image_url?: string }[];
}

interface AgentBody {
  text?: string;
  sessionId?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/canvas/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["ARK_API_KEY"];
        if (!key) return json({ error: { message: "Agent key is not configured." } }, 500);

        const body = (await request.json().catch(() => ({}))) as AgentBody;
        const text = (body.text ?? "").trim();
        if (!text || text.length > 4000) {
          return json({ error: { message: "Message is empty or too long." } }, 400);
        }
        const sessionId = (body.sessionId || process.env["ARK_SESSION_ID"] || "").trim();
        if (!/^sesn-[A-Za-z0-9-]{4,60}$/.test(sessionId)) {
          return json({ error: { message: "Missing or invalid session ID." } }, 400);
        }

        const headers = {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        };
        const base = `${ARK_SESSIONS}/${sessionId}`;

        const postRes = await fetch(`${base}/events`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            events: [{ type: "user.message", content: [{ type: "text", text }] }],
          }),
        });
        const postJson = (await postRes.json().catch(() => ({}))) as {
          data?: { id?: string }[];
          error?: { message?: string };
        };
        if (!postRes.ok) {
          return json(
            { error: { message: postJson.error?.message || `Agent rejected the message (${postRes.status}).` } },
            502,
          );
        }
        const sentId = postJson.data?.[0]?.id;

        // Poll newest-first until the agent finishes this turn.
        for (let i = 0; i < 90; i++) {
          await new Promise((r) => setTimeout(r, 2000));

          const evRes = await fetch(`${base}/events?order=desc&limit=50`, { headers });
          if (!evRes.ok) continue;
          const evJson = (await evRes.json().catch(() => ({}))) as { data?: ArkEvent[] };
          const newestFirst = evJson.data ?? [];
          // Everything newer than the message we just posted.
          const cut = sentId ? newestFirst.findIndex((e) => e.id === sentId) : -1;
          const fresh = cut >= 0 ? newestFirst.slice(0, cut) : newestFirst;
          if (cut < 0 && i < 3) continue;

          const idle = fresh.some((e) => e.type === "session.status_idle");
          const replies = fresh
            .filter((e) => e.type === "agent.message")
            .reverse()
            .flatMap((e) => (e.content ?? []).map((c) => c.text).filter(Boolean));
          const media = fresh
            .flatMap((e) => e.content ?? [])
            .map((c) => c.url || c.image_url)
            .filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u));

          if (idle && replies.length) {
            return json({ reply: replies.join("\n\n"), media });
          }
        }

        return json({ error: { message: "The agent is taking too long — try again." } }, 504);
      },
    },
  },
});
