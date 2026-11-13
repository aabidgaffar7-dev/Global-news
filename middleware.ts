import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { OPINION_COOKIE, OPINION_COOKIE_MAX_AGE } from "@/lib/opinion";

// Remember an explicit ?opinion=hide|show choice so it sticks across pages.
function rememberOpinion(request: NextRequest, response: NextResponse) {
  const choice = request.nextUrl.searchParams.get("opinion");
  if (choice === "hide" || choice === "show") {
    response.cookies.set(OPINION_COOKIE, choice === "hide" ? "1" : "0", {
      path: "/",
      maxAge: OPINION_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }
  return response;
}

// Refreshes the Supabase auth session cookie on each request so server
// components see a valid user. No-op when Supabase isn't configured.
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });
  if (!url || !anon) return rememberOpinion(request, response);

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate protected routes at the edge so they cleanly 307 to /login before any
  // page renders — no shell flash, and correct for crawlers / no-JS. The
  // page-level redirect("/login") stays as defense-in-depth.
  const PROTECTED = [
    "/account",
    "/following",
    "/for-you",
    "/saved",
    "/history",
    "/welcome",
  ];
  const path = request.nextUrl.pathname;
  if (!user && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    // Carry the destination so login can return the user to what they wanted.
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  return rememberOpinion(request, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|textures|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
