import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  // Explicitly include packages that need pre-bundling so Vite doesn't
  // print the "Could not auto-determine entry point ..." warning in
  // environments that don't detect entry points (server-driven apps).
  optimizeDeps: {
    include: [
      "@supabase/supabase-js",
      "@supabase/auth-ui-svelte",
      "@supabase/auth-ui-shared",
      "@supabase/ssr",
    ],
  },
});
