import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const SYSTEM_REDIRECTS = {
  interpos: "https://pos.interfundeoms.edu.co",
  otro: "https://loquesiga.interfundeoms.edu.co",
};

const DEFAULT_REDIRECT = "https://pos.interfundeoms.edu.co";

const ALLOWED_DOMAINS = [
  "https://auth.interfundeoms.edu.co",
  "https://supa.interfundeoms.edu.co",
];

export const load: PageServerLoad = async ({ url, locals }) => {
  const code = url.searchParams.get("code");
  // const system = url.searchParams.get("system"); // We might use this for UI context but not for redirecting away
  // const redirectTo = url.searchParams.get("redirect_to"); // Ignore for auto-redirect

  // 1. Si no hay código, carga normal
  if (!code) {
    return {};
  }

  // 2. Procesar el código silenciosamente
  try {
    const supabase = locals.supabase;
    // Intentar intercambiar el código.
    // Esto seteará las cookies de sesión si es exitoso.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // code inválido, expirado, usado, etc.
      // REGLA: "si no es válido → ignorar silenciosamente"
      // Solo logueamos para debug del desarrollador, no mostramos error al usuario
      console.warn("Silently ignoring invalid auth code:", error.message);
    } else {
      console.log("✅ Auth code exchanged successfully");
      // Sesión establecida.
      // REGLA: "continuar el login"
      // NO REDIRIGIMOS. Dejamos que la página cargue con la sesión activa.
      // El +page.svelte o +layout.svelte mostrarán el estado autenticado.
    }
  } catch (err) {
    // REGLA: "No muestres errores visibles... El sistema debe ignorarlo sin romper la página."
    console.warn("Unexpected error processing auth code (ignored):", err);
  }

  // 3. Retornar carga normal, sin redirecciones ni errores visibles
  return {};
};
