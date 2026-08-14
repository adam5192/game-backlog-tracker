import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();

  // credentials stay entirely server-side here, never sent to the browser
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.DEMO_EMAIL!,
    password: process.env.DEMO_PASSWORD!,
  });

  if (error) {
    console.error("Demo login failed:", error.message); // check vercels function logs for this
    return NextResponse.json(
      { error: "Couldn't load the demo right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
