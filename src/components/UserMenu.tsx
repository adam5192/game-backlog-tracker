"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import { Sun, Moon, LogOut, Settings, AlertCircle } from "lucide-react";

type Props = {
  email: string;
  avatarUrl: string | null;
  hasProfile: boolean;
};

export default function UserMenu({ email, avatarUrl, hasProfile }: Props) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full bg-accent text-accent-foreground text-xs font-medium flex items-center justify-center hover:opacity-90 transition-opacity relative overflow-hidden"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          (email[0]?.toUpperCase() ?? "?")
        )}
        {/* a small red dot on the avatar itself to alert user to create their profile*/}
        {!hasProfile && (
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-danger border border-surface-2" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-64 bg-surface-2 border border-border-color rounded-2xl overflow-hidden shadow-lg z-50">
          <div className="px-4 py-3 border-b border-border-color">
            <p className="text-sm text-foreground truncate">{email}</p>
          </div>

          {/* only shown if this user has never set up a display name */}
          {!hasProfile && (
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-start gap-2.5 px-4 py-3 text-sm hover:bg-surface-1 transition-colors border-b border-border-color"
            >
              <AlertCircle size={16} className="text-accent shrink-0 mt-0.5" />
              <span className="text-text-secondary">
                <span className="text-foreground font-medium">
                  Set up your profile
                </span>{" "}
                so other users can interact with your profile, lists, and
                reviews.
              </span>
            </Link>
          )}

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-surface-1 transition-colors"
          >
            <Settings size={16} />
            Settings
          </Link>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-surface-1 transition-colors"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          <form
            action="/api/auth/signout"
            method="POST"
            className="border-t border-border-color"
          >
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-surface-1 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
