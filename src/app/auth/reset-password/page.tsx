"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleReset() {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated. You're now logged in.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-surface-2 border border-border-color rounded-2xl max-w-sm w-full p-6">
        <h1 className="text-lg font-medium text-foreground mb-1">
          Set a new password
        </h1>
        <p className="text-sm text-text-secondary mb-5">
          Choose a new password for your account.
        </p>

        <label className="text-sm text-text-secondary block mb-1">
          New password
        </label>
        <input
          type="password"
          className="bg-surface-1 text-foreground px-4 py-2 rounded-lg w-full border border-border-color focus:border-accent outline-none transition-colors mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="text-sm text-text-secondary block mb-1">
          Confirm password
        </label>
        <input
          type="password"
          className="bg-surface-1 text-foreground px-4 py-2 rounded-lg w-full border border-border-color focus:border-accent outline-none transition-colors mb-4"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleReset()}
        />

        <button
          className="w-full text-sm px-4 py-2 rounded-full bg-accent text-accent-foreground disabled:opacity-50"
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </div>
    </div>
  );
}
