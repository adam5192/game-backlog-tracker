import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import NavBarContent from "./NavBarContent";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // fetch the profile row alongside auth, so we can show a real avatar (and know if they set one up yet)
  const profileRows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id));
  const profile = profileRows[0] ?? null;

  return (
    <NavBarContent
      email={user.email ?? ""}
      avatarUrl={profile?.avatarUrl ?? null}
      hasProfile={profile != null}
    />
  );
}
