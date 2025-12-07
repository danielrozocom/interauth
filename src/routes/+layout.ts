import { createSupabaseBrowserClient } from "$lib/config/supabase";
import { isBrowser } from "@supabase/ssr";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
  depends("supabase:auth");

  let supabase;

  if (isBrowser()) {
    supabase = createSupabaseBrowserClient(fetch);
  }

  return { supabase, ...data };
};
