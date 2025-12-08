<script lang="ts">
  /**
   * Layout Root Component
   *
   * Este componente envuelve toda la aplicación.
   * Aplica el color principal del brand dinámicamente y carga la fuente Nunito.
   */

  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import type { LayoutData } from "./$types";
  import "../app.css";

  // Debug logs for env vars
  if (browser) {
    console.log("DEBUG PUBLIC_SUPABASE_URL", import.meta.env.PUBLIC_SUPABASE_URL);
    console.log(
      "DEBUG PUBLIC_SUPABASE_ANON_KEY",
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? "SET" : "UNSET"
    );
  }

  // Recibir datos del servidor (modo runes): usar $props()
  const { data, children } = $props<{ data: LayoutData; children: any }>();

  // Aplicar el color principal dinámicamente
  $effect(() => {
    if (browser && data.brandConfig) {
      // Setear la variable CSS --primary en el root
      document.documentElement.style.setProperty(
        "--primary",
        data.brandConfig.primaryColor
      );
    }
  });
</script>

<svelte:head>
  <!-- Fuente Nunito desde Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin="anonymous"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
  <title>Login | {data.brandConfig?.name || "InterAuth"}</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  {@render children()}
</main>

<style>
  :global(body) {
    font-family: "Nunito", system-ui, sans-serif;
    margin: 0;
    padding: 0;
  }
</style>
