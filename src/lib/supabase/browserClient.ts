import { createBrowserClient } from "@supabase/ssr";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";

export function createSupabaseBrowserClient({
  fetch,
  url,
  key,
}: {
  fetch?: typeof globalThis.fetch;
  url?: string;
  key?: string;
}) {
  const supabaseUrl = url || PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = key || PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "❌ Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY in browser env"
    );
  }

  return createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      detectSessionInUrl: false, // We handle this manually or via callback
      persistSession: true,
      autoRefreshToken: true,
    },
    cookieOptions: {
      domain: import.meta.env.DEV ? undefined : ".interfundeoms.edu.co",
      path: "/",
      sameSite: "lax",
      secure: !import.meta.env.DEV,
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
