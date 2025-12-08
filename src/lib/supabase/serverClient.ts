import { createServerClient } from "@supabase/ssr";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";

export function createSupabaseServerClient({
  request,
  cookies,
}: {
  request?: Request; // Make optional/flexible if needed, but usually passed from event
  cookies: any; // SvelteKit cookies object
}) {
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
    console.error(
      "❌ Falta PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY en el servidor"
    );
    // We can allow it to proceed and fail later, or throw.
    // Throwing ensures we don't deploy with missing envs.
  }

  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => cookies.get(key),
      set: (key, value, options) => {
        cookies.set(key, value, { ...options, path: "/" });
      },
      remove: (key, options) => {
        cookies.delete(key, { ...options, path: "/" });
      },
    },
    auth: {
      detectSessionInUrl: false,
      autoRefreshToken: false, // Server client shouldn't refresh tokens automatically usually? Actually for SSR it's fine.
    },
  });
}
