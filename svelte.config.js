import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({ out: "build" }),
    // NOTE: Vite options are handled in `vite.config.ts/js` so tooling that
    // consumes JavaScript Vite configs (like some deployment builders) will
    // reliably pick them up.
  },
};

export default config;
