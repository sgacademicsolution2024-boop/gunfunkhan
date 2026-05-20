import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vite environment."
    : "";

export const supabase: SupabaseClient | null = supabaseConfigError
  ? null
  : createClient(supabaseUrl as string, supabaseAnonKey as string);

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  return supabase;
}
