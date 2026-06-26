import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Both vars are NEXT_PUBLIC so the same client works on the server (ranking reads)
// and in the browser (click tracking). The anon key is meant to be public; all
// writes go through a SECURITY DEFINER RPC, so the table itself is read-only.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anonKey);

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}
