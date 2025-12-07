import { createBrowserClient } from "@supabase/ssr";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  console.error(
    "❌ Falta PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY en el browser"
  );
}

export function createSupabaseBrowserClient(fetch?: typeof globalThis.fetch) {
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "@supabase/ssr: Your project's URL and API key are required to create a Supabase client!"
    );
  }

  return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      detectSessionInUrl: false,
      persistSession: true,
    },
    global: {
      fetch,
    },
    cookies: {
      get(key) {
        const cookie = parse(document.cookie);
        return cookie[key];
      },
      set(key, value) {
        document.cookie = `${key}=${value}; path=/`;
      },
      remove(key) {
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      },
    },
  });
}

/**
 * Simple cookie parser (for browser client)
 */
function parse(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;

  cookieString.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) {
      cookies[name] = rest.join("=");
    }
  });

  return cookies;
}
