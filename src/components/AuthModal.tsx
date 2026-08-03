"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AuthModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  if (!open) return null;

  async function handleSubmit() {
    setLoading(true);
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    onClose();
    router.push("/dashboard");
    router.refresh(); // ensures navbar re-checks auth state
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface-1 border border-border-color rounded-2xl max-w-sm w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-foreground mb-1">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h3>
        <p className="text-sm text-text-secondary mb-5">
          {mode === "login"
            ? "Log in to see your backlog."
            : "Start tracking your games."}
        </p>

        <label className="text-sm text-text-secondary block mb-1">Email</label>
        <input
          className="bg-background text-foreground placeholder-text-secondary px-4 py-2 rounded-lg w-full border border-border-color focus:border-accent outline-none transition-colors mb-3"
          placeholder="name@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="text-sm text-text-secondary block mb-1">Password</label>
        <input
          type="password"
          className="bg-background text-foreground px-4 py-2 rounded-lg w-full border border-border-color focus:border-accent outline-none transition-colors mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full text-sm px-4 py-2 rounded-full bg-accent text-accent-foreground disabled:opacity-50 mb-3"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
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

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-foreground"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
