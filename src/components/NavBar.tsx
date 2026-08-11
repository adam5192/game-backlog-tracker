import { createClient } from "@/utils/supabase/server";
import NavBarContent from "./NavBarContent";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return <NavBarContent email={user.email ?? ""} />;
}
