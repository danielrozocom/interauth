import { createServerClient } from "@supabase/ssr";
import { env } from "$env/dynamic/private";

export function createSupabaseServerClient({
  request,
  cookies,
  url,
}: {
  request: any;
  cookies: any;
  url: any;
}) {
  const supabaseUrl = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("❌ Falta SUPABASE_URL o SUPABASE_ANON_KEY en el servidor");
    throw new Error("Supabase server envs not configured");
  }

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      get: (key) => cookies.get(key),
      set: (key, value, options) => cookies.set(key, value, options),
      remove: (key, options) => cookies.delete(key, options),
    },
  });
}
