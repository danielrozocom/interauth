/**
 * Supabase Configuration and Client Initialization
 *
 * This module centralizes all Supabase client creation for both server and browser environments.
 * It ensures proper environment variable handling and follows SvelteKit best practices.
 */

import {
  createServerClient,
  createBrowserClient,
  isBrowser,
} from "@supabase/ssr";
import type { RequestEvent } from "@sveltejs/kit";

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

/**
 * Server-side environment variables (only available on server)
 */
const getServerEnv = () => ({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
});

/**
 * Client-side environment variables (available in browser via import.meta.env)
 */
const getClientEnv = () => ({
  supabaseUrl: import.meta.env.PUBLIC_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
});

// ============================================================================
// SERVER CLIENT
// ============================================================================

/**
 * Creates a Supabase server client for SSR
 * This should only be used in server-side code (hooks.server.ts, +page.server.ts, etc.)
 */
export function createSupabaseServerClient(event: RequestEvent) {
  const { supabaseUrl, supabaseAnonKey } = getServerEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "@supabase/ssr: Your project's URL and API key are required to create a Supabase client!\n" +
        "Check your Supabase project's API settings to find these values\n" +
        "https://supabase.com/dashboard/project/_/settings/api"
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: "/" });
        });
      },
    },
  });
}

// ============================================================================
// BROWSER CLIENT
// ============================================================================

/**
 * Creates a Supabase browser client
 * This should only be used in client-side code (+layout.ts, components, etc.)
 */
export function createSupabaseBrowserClient(fetch?: typeof globalThis.fetch) {
  if (!isBrowser()) {
    throw new Error(
      "createSupabaseBrowserClient can only be called in the browser"
    );
  }

  const { supabaseUrl, supabaseAnonKey } = getClientEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "@supabase/ssr: Your project's URL and API key are required to create a Supabase client!\n" +
        "Check your Supabase project's API settings to find these values\n" +
        "https://supabase.com/dashboard/project/_/settings/api"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
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

// ============================================================================
// UTILITIES
// ============================================================================

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
