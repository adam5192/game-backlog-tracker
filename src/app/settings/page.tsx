"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Image from "next/image";

export default function SettingsPage() {
  // actively editing fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  async function loadProfile() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        throw new Error("Failed to load profile");
      }
      const data = await res.json();
      // data.profile will be null if user didnt set it up, so leave evetyhing empty
      setDisplayName(data.profile?.displayName ?? "");
      setBio(data.profile?.bio ?? "");
      setAvatarUrl(data.profile?.avatarUrl ?? null);
    } catch (err) {
      console.error("Error loading profile:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5 * 1024 * 1024 = 5 megabytes
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You need to be logged in to upload a photo");
        return;
      }

      // build a unique file path so repeated uploads dont overwrite each other
      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // supabase storage uploads dont automatically give a usable url
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrlData.publicUrl);
      toast.success("Photo uploaded");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error("Couldn't upload your photo. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    // client side check first
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, avatarUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Couldn't save your profile");
        return;
      }

      toast.success("Profile updated");
    } catch (err) {
      // if the requested never completed
      console.error("Error saving profile:", err);
      toast.error("Something went wrong. Check your connection and try again.");
    } finally {
      setSaving(true);
    }
  }

  // State 1 : initial load in progress
  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-8 max-w-2xl mx-auto text-text-secondary text-sm">
        Loading your profile...
      </div>
    );
  }

  // State 2: if the load failed, give the user an option to retry
  if (loadError) {
    return (
      <div className="px-4 py-8 sm:px-8 max-w-2xl mx-auto text-center">
        <p className="text-text-secondary text-sm mb-3">
          Couldn&apos;t load your profile right now.
        </p>
        <button
          onClick={loadProfile}
          className="text-sm px-4 py-2 rounded-full border border-border-color text-foreground hover:bg-surface-1 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // State 3: the actual form
  return (
    <div className="px-4 py-8 sm:px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-medium text-foreground mb-6">
        Your profile
      </h1>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-surface-1 relative overflow-hidden shrink-0">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt="Your avatar"
              fill
              className="object-cover"
              sizes="64px"
            />
          )}
        </div>
        <label className="text-sm px-4 py-2 rounded-full border border-border-color text-foreground hover:bg-surface-1 transition-colors cursor-pointer">
          {uploading ? "Uploading..." : "Change photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <label className="text-sm text-text-secondary block mb-1">
        Display name
      </label>
      <input
        className="bg-surface-1 text-foreground placeholder-text-secondary px-4 py-2 rounded-lg w-full border border-border-color focus:border-accent outline-none transition-colors mb-1"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        maxLength={50}
      />
      {/* live character counter */}
      <p className="text-xs text-text-secondary mb-4">
        {displayName.length}/50
      </p>

      <label className="text-sm text-text-secondary block mb-1">Bio</label>
      <textarea
        className="bg-surface-1 text-foreground placeholder-text-secondary px-4 py-2 rounded-lg w-full border border-border-color focus:border-accent outline-none transition-colors mb-1 resize-none"
        rows={3}
        placeholder="Tell people a bit about your taste in games..."
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={300}
      />
      <p className="text-xs text-text-secondary mb-4">{bio.length}/300</p>

      <button
        className="text-sm px-4 py-2 rounded-full bg-accent text-accent-foreground disabled:opacity-50"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </div>
  );
}
