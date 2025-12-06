import { createBrowserClient, isBrowser, parse } from "@supabase/ssr";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
  depends("supabase:auth");

  const supabase = createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        // Evitar que el cliente procese automáticamente el fragmento de URL.
        // Usamos una ruta callback dedicada que llamará a `getSessionFromUrl`.
        detectSessionInUrl: false,
        persistSession: true,
      },
      global: {
        fetch,
      },
      cookies: {
        get(key) {
          if (!isBrowser()) {
            return JSON.stringify(data.session);
          }

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
    }
  );

  return { supabase, ...data };
};
