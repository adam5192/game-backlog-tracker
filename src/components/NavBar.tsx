import { createClient } from "@/utils/supabase/server";
import NavLinks from "./NavLinks";
import UserMenu from "./UserMenu";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <div className="flex items-center justify-between border-b border-border-color px-8 py-4">
      <div className="flex items-center gap-7">
        <span className="font-medium text-foreground">Ludodex</span>
        <NavLinks />
      </div>
      <UserMenu email={user.email ?? ""} />
    </div>
  );
}
