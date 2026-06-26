import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnabled } from "./supabase";
import type { User } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Cookie-bound Supabase client for server components / route handlers.
// cache() dedupes it to one instance per request render.
export const getServerSupabase = cache(async () => {
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Server Components can't set cookies — the middleware refreshes them.
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* called from a Server Component render — safe to ignore */
        }
      },
    },
  });
});

export const getUser = cache(async (): Promise<User | null> => {
  if (!supabaseEnabled) return null;
  const sb = await getServerSupabase();
  const { data } = await sb.auth.getUser();
  return data.user;
});
