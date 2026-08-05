import { createClient } from "@/utils/supabase/server";
import ThemeToggle from "./ThemeToggle";
import NavLinks from "./NavLinks";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // logged out visiters dont see the nav
  if (!user) return null;

  return (
    <div className="flex items-center justify-between border-b border-border-color px-8  py-4">
      <div className="flex items-center gap-7">
        <span className="font-medium text-foreground">Playloggd</span>
        <NavLinks />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {/* avatar circle showing the user initial. will change to drop-down later */}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-8 h-8 rounded-full bg-surface-2 text-foreground text-xs font-medium flex items-center justify-center hover:bg-border-color transition-colors"
            title="Sign out"
          >
            {user.email?.[0].toUpperCase() ?? "?"}
          </button>
        </form>
      </div>
    </div>
  );
}
