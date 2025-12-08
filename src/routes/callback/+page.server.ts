import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const system = url.searchParams.get("system");
  const type = url.searchParams.get("type"); // recovery, signup, etc.

  // Estado inicial de la respuesta
  const result = {
    connected: false,
    message: "",
    redirectUrl: "/",
    isRecovery: type === "recovery",
  };

  // 1. Validar si hay código
  if (!code) {
    result.message = "No se recibió ningún código de autenticación.";
    return result;
  }

  try {
    // 2. Intercambiar el código por sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.warn("Error en exchangeCodeForSession:", error.message);
      // Mensaje amigable, NO redirigimos, NO error 500
      result.message =
        "El enlace no es válido o ha expirado. Por favor solicita uno nuevo.";
      return result;
    }

    // 3. Verificar sesión activa
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      result.message =
        "No se pudo establecer la sesión. Intenta iniciar sesión manualmente.";
      return result;
    }

    // 4. Éxito: Preparar URL de destino (interna o permitida)
    result.connected = true;
    result.message = "Verificado correctamente. Redirigiendo...";

    // Logica de destino (similar a la original pero más simple)
    if (next && next.startsWith("/")) {
      result.redirectUrl = next; // Ruta interna
    } else if (system === "pos") {
      result.redirectUrl = process.env.POS_URL || "/"; // Externa conocida
    } else if (system === "app") {
      result.redirectUrl = process.env.APP_URL || "/"; // Externa conocida
    } else if (type === "recovery") {
      // Si es recuperación, mandamos al home (o donde esté el formulario de cambio de clave)
      // O podemos manejarlo aquí mismo si el usuario quiere.
      // Pero el usuario pidió "flujo completo... permitir cambiar contraseña".
      // Si mandamos a "/" (home), el +page.svelte que hicimos antes detectará el evento 'recovery' y mostrará el form.
      result.redirectUrl = "/?type=recovery&code_valid=true";
    } else {
      result.redirectUrl = "/";
    }
  } catch (err: any) {
    console.error("Excepción en callback:", err);
    result.message = "Ocurrió un error inesperado al procesar la solicitud.";
  }

  return result;
};
