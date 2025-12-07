import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  // When Vite can't auto-detect a single entry point (common with SvelteKit
  // / server-driven setups) it won't pre-bundle dependencies. Explicitly
  // listing packages here prevents the "Could not auto-determine entry
  // point" warning and ensures fast dev-server cold starts.
  optimizeDeps: {
    entries: [
      "src/routes/**/*.svelte",
      "src/routes/**/*.ts",
      "src/routes/**/*.js",
      "src/app.html",
    ],
    include: [
      "@supabase/supabase-js",
      "@supabase/auth-ui-svelte",
      "@supabase/auth-ui-shared",
      "@supabase/ssr",
    ],
  },
});
