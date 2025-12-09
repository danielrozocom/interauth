import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env } from "$env/dynamic/private";

export function createSupabaseAdminClient() {
  const supabaseUrl = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client"
    );
    throw new Error("Server configuration error: Missing admin keys");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseServerClient({
  request,
  cookies,
}: {
  request?: Request; // Make optional/flexible if needed, but usually passed from event
  cookies: any; // SvelteKit cookies object
}) {
  const supabaseUrl = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      `❌ Falta PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY en el servidor.
       Values seen: URL=${supabaseUrl ? "SET" : "UNSET"}, KEY=${
        supabaseAnonKey ? "SET" : "UNSET"
      }`
    );
    // If we are strictly crashing here, it's good, but lets make sure we read the right vars.
  }

  return createServerClient(supabaseUrl || "", supabaseAnonKey || "", {
    cookies: {
      get: (key) => cookies.get(key),
      set: (key, value, options) => {
        cookies.set(key, value, {
          ...options,
          path: "/",
          // Allow cookie sharing across subdomains (e.g. auth.interfundeoms.edu.co -> pos.interfundeoms.edu.co)
          domain:
            process.env.NODE_ENV === "development"
              ? undefined
              : ".interfundeoms.edu.co",
          sameSite: "lax",
          secure: process.env.NODE_ENV !== "development",
        });
      },
      remove: (key, options) => {
        cookies.delete(key, {
          ...options,
          path: "/",
          domain:
            process.env.NODE_ENV === "development"
              ? undefined
              : ".interfundeoms.edu.co",
        });
      },
    },
    auth: {
      detectSessionInUrl: false,
      autoRefreshToken: false, // Server client shouldn't refresh tokens automatically usually? Actually for SSR it's fine.
    },
  });
}
