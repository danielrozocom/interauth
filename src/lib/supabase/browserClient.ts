import { createBrowserClient } from "@supabase/ssr";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";

export function createSupabaseBrowserClient(fetch?: typeof globalThis.fetch) {
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
    console.error(
      "❌ Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY in browser env"
    );
    // Return a dummy client or throw? Throwing is safer to catch config errors early.
    // However, to avoid crashing the whole app if just one page needs it, we could warn.
    // But the user said "Falta... Error... Quiero que funcione al 100%".
    // Throwing is correct if it's required.
  }

  return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      detectSessionInUrl: false, // We handle this manually or via callback
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch,
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
