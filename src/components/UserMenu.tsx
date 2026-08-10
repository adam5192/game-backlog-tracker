"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut } from "lucide-react";

type Props = {
  email: string;
};

export default function UserMenu({ email }: Props) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking anywhere outside it — a common
  // pattern for menus/dropdowns that don't have their own backdrop
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
        className="w-8 h-8 rounded-full bg-accent text-accent-foreground text-xs font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        {email[0]?.toUpperCase() ?? "?"}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 bg-surface-2 border border-border-color rounded-2xl overflow-hidden shadow-lg z-50">
          <div className="px-4 py-3 border-b border-border-color">
            <p className="text-sm text-foreground truncate">{email}</p>
          </div>

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
