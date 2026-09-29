// @ts-nocheck
// Sign-in card for the studio: email/password plus Google, backed by Lovable Cloud.
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onSignedIn: () => void;
  onClose?: () => void;
}

export function AuthPanel({ onSignedIn, onClose }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) onSignedIn();
    });
    return () => data.subscription.unsubscribe();
  }, [onSignedIn]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw new Error(err.message);
        setError("Check your inbox — confirm the link, then sign in.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw new Error(err.message);
        onSignedIn();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message);
      setBusy(false);
      return;
    }
    if (!result.redirected) setBusy(false);
  };

  return (
    <div className="aurora-modal" onClick={() => onClose?.()}>
      <div className="aurora-modal-box aurora-auth-box" onClick={(e) => e.stopPropagation()}>
        <h2>{mode === "signup" ? "Create your Aurora account" : "Sign in to Aurora"}</h2>
        <p className="aurora-auth-sub">
          Your gallery, packs, storyboards and drafts sync to the cloud — same studio on every device.
        </p>
        <form onSubmit={submit}>
          <div className="aurora-fld">
            <label htmlFor="aurora-auth-email">Email</label>
            <input
              id="aurora-auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@outthemud.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="aurora-fld">
            <label htmlFor="aurora-auth-pass">Password</label>
            <input
              id="aurora-auth-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </div>
          {error && <p role="alert" className="aurora-voice-error">{error}</p>}
          <button type="submit" className="aurora-btn-p aurora-auth-submit" disabled={busy}>
            {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
        <button type="button" className="aurora-btn-s aurora-auth-google" disabled={busy} onClick={google}>
          Continue with Google
        </button>
        <button
          type="button"
          className="aurora-auth-switch"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError("");
          }}
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
        {onClose && (
          <button type="button" className="aurora-auth-later" onClick={onClose}>
            Later — use the studio offline
          </button>
        )}
      </div>
    </div>
  );
}
