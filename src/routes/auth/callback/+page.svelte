<script lang="ts">
  import { onMount } from "svelte";
  import { createBrowserClient } from "@supabase/ssr";

  onMount(async () => {
    try {
      const supabase = createBrowserClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Procesar la URL devuelta por el proveedor (token en fragmento/url)
      const { data, error } = await supabase.auth.getSessionFromUrl({
        storeSession: true,
      });

      if (error) {
        console.error("Error al obtener la sesión desde la URL:", error);
      } else {
        console.debug("Sesión obtenida desde URL:", data);
      }

      // Si la URL contiene un param `target`, redirigimos ahí.
      const params = new URLSearchParams(window.location.search);
      const target = params.get("target") || "/";

      // Redirigir al destino final (reemplaza el historial para evitar volver al callback)
      window.location.replace(target);
    } catch (err) {
      console.error("Error en el callback de autenticación:", err);
      // En caso de error, ir al root de la app
      window.location.replace("/");
    }
  });
</script>

<svelte:head>
  <title>Procesando autenticación…</title>
</svelte:head>

<div style="padding:2rem;text-align:center;">
  <h2>Procesando autenticación…</h2>
  <p>Redirigiendo, por favor espere.</p>
</div>
