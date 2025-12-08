import { createSupabaseBrowserClient } from "$lib/supabase/browserClient";
import { isBrowser } from "@supabase/ssr";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
  depends("supabase:auth");

  let supabase;
  if (isBrowser()) {
    supabase = createSupabaseBrowserClient({
      fetch,
      url: (data as any).supabaseUrl,
      key: (data as any).supabaseAnonKey,
    });
    console.log("✅ Supabase Client Initialized");
  }

  return { supabase, ...data };
};
