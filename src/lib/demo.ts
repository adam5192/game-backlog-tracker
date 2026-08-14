import { NextResponse } from "next/server";

// blocks destructive actions from the demo account (delete, remove)
export function blockIfDemoUser(userId: string) {
  if (userId === process.env.DEMO_USER_ID) {
    return NextResponse.json(
      {
        error:
          "This is a shared demo account, so this action isn't available. Feel free to explore everything else!",
      },
      { status: 403 },
    );
  }
  return null;
}
