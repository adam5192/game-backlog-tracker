"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import UserMenu from "./UserMenu";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/import", label: "Import" },
  { href: "/stats", label: "Stats" },
  { href: "/lists", label: "Lists" },
];

type Props = {
  email: string;
  avatarUrl: string | null;
  hasProfile: boolean;
};

export default function NavBarContent({ email, avatarUrl, hasProfile }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="border-b border-border-color">
      <div className="flex items-center justify-between px-4 sm:px-8 py-4">
        <div className="flex items-center gap-7">
          <span className="font-medium text-foreground">Playloggd</span>

          {/* hidden below sm, shown as a normal row on sm and up */}
          <div className="hidden sm:flex items-center gap-7">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-text-secondary hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UserMenu
            email={email}
            avatarUrl={avatarUrl}
            hasProfile={hasProfile}
          />
          {/* hamburger only shows below sm */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-surface-1 transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* slide-down mobile panel, only rendered on small screens when open */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border-color px-4 py-3 flex flex-col gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-sm px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-surface-1 text-foreground font-medium"
                    : "text-text-secondary hover:bg-surface-1 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
