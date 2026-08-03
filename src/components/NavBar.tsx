import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // logged out visiters dont see the nav
  if (!user) return null;

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/search", label: "Search" },
    { href: "/import", label: "Import" },
    { href: "/stats", label: "Stats" }, // not built yet, but wiring the nav now
  ];

  return (
    <div className="flex items-center justify-between border-b border-gray-800 px-8  py-4">
      <div className="flex items-center gap-7">
        <span className="font-medium text-gray-100">Backlog</span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
      {/* avatar circle showing the user initial. will change to drop-down later */}
      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className="w-8 h-8 rounded-full bg-gray-800 text-gray-100 text-xs font-medium flex items-center justify-center hover:bg-gray-700 transition-colors"
          title="Sign out"
        >
          {user.email?.[0].toUpperCase() ?? "?"}
        </button>
      </form>
    </div>
  );
}
