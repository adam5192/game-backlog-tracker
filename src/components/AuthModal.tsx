"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GoogleIcon from "./GoogleIcon";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AuthModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "signup" | "check-email">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  if (!open) return null;

  async function handleSubmit() {
    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.session) {
        setMode("check-email");
        return;
      }

      onClose();
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    onClose();
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleResendConfirmation() {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Confirmation email sent again");
  }

  function handleClose() {
    // reset back to a clean login view next time the modal opens,
    // rather than reopening on whatever state it was last left in
    setMode("login");
    setEmail("");
    setPassword("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div
        className="bg-surface-2 border border-border-color rounded-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-text-secondary hover:text-foreground transition-colors"
        >
          ×
        </button>

        {mode === "check-email" ? (
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Check your email
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              We sent a confirmation link to{" "}
              <span className="text-foreground">{email}</span>. Click it to
              activate your account, then come back here to log in.
            </p>
            <button
              onClick={handleResendConfirmation}
              disabled={loading}
              className="text-sm text-text-secondary hover:text-foreground underline disabled:opacity-50 mb-4"
            >
              {loading ? "Sending..." : "Didn't get it? Resend"}
            </button>
            <button
              onClick={() => setMode("login")}
              className="w-full text-sm px-4 py-2 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
            >
              Back to login
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-medium text-foreground mb-1">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              {mode === "login"
                ? "Log in to see your backlog."
                : "Start tracking your games."}
            </p>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-full border border-border-color text-foreground hover:bg-surface-1 transition-colors mb-4"
            >
              <GoogleIcon size={18} />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border-color" />
              <span className="text-xs text-text-secondary">or</span>
              <div className="flex-1 h-px bg-border-color" />
            </div>

            <label className="text-sm text-text-secondary block mb-1">
              Email
            </label>
            <input
              className="bg-surface-1 text-foreground placeholder-text-secondary px-4 py-2 rounded-lg w-full border border-border-color focus:border-accent outline-none transition-colors mb-3"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="text-sm text-text-secondary block mb-1">
              Password
            </label>
            <input
              type="password"
              className="bg-surface-1 text-foreground px-4 py-2 rounded-lg w-full border border-border-color focus:border-accent outline-none transition-colors mb-4"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="w-full text-sm px-4 py-2 rounded-full bg-accent text-accent-foreground disabled:opacity-50 mb-3"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Log in"
                  : "Sign up"}
            </button>

            <p className="text-center text-sm text-text-secondary">
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                className="text-foreground underline"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
