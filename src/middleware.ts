import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// check if user login session needs refreshing so it doesnt expire
export async function middleware(request: NextRequest) {
  // add early so supabase can attach updated cookies, return later
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // read current cookies to know whos logged in
        getAll() {
          return request.cookies.getAll();
        },
        // write new cookies to incoming request and outgoing response
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() triggers supabase to check/refresh
  await supabase.auth.getUser();

  return supabaseResponse;
}

// tells Next.js which requests should run through this middleware
// exclude static files and images
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
