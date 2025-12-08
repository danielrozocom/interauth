import type { PageServerLoad } from "./$types";
import { DEFAULT_REDIRECT_URL, resolveBrand } from "$lib/brandConfig";

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const system = url.searchParams.get("system");
  const type = url.searchParams.get("type"); // recovery, signup, etc.
  // Support both camelCase and snake_case for redirect URL
  const redirectTo =
    url.searchParams.get("redirectTo") || url.searchParams.get("redirect_to");

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

    // Lógica de destino actualizada
    if (redirectTo) {
      // Redirigir exactamente a la URL solicitada
      result.redirectUrl = redirectTo;
    } else if (type === "recovery") {
      result.redirectUrl = "/?type=recovery&code_valid=true";
    } else {
      const brandConfig = resolveBrand(system);
      if (brandConfig && brandConfig.redirectUrlAfterLogin) {
        result.redirectUrl = brandConfig.redirectUrlAfterLogin;
      } else {
        result.redirectUrl = DEFAULT_REDIRECT_URL;
      }
    }

    console.log("--- Callback Redirect Debug ---");
    console.log("Current URL:", url.toString());
    console.log("Redirect To Param:", redirectTo);
    console.log("Final Redirect URL:", result.redirectUrl);
    console.log("-------------------------------");
  } catch (err: any) {
    console.error("Excepción en callback:", err);
    result.message = "Ocurrió un error inesperado al procesar la solicitud.";
  }

  return result;
};
