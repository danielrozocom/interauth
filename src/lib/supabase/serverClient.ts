import { createServerClient } from "@supabase/ssr";
import { env } from "$env/dynamic/private";
import type { RequestEvent } from "@sveltejs/kit";

export function createSupabaseServerClient(event: RequestEvent) {
  const url = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error("❌ Falta SUPABASE_URL o SUPABASE_ANON_KEY en el servidor");
    throw new Error("Supabase server envs not configured");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get: (key) => event.cookies.get(key),
      set: (key, value, options) => event.cookies.set(key, value, options),
      remove: (key, options) => event.cookies.delete(key, options),
    },
  });
}
