import type { PageServerLoad } from "./$types";
import { DEFAULT_REDIRECT_URL, resolveBrand } from "$lib/brandConfig";

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get("code");
  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token");
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

  // 1. Validar si hay código o tokens
  if (type === "recovery") {
    if (!accessToken || !refreshToken) {
      result.message = "Tokens de recuperación no encontrados en la URL.";
      return result;
    }
  } else {
    if (!code) {
      result.message = "No se recibió ningún código de autenticación.";
      return result;
    }
  }

  try {
    // 2. Establecer sesión
    let error;
    if (type === "recovery") {
      const { error: setError } = await supabase.auth.setSession({
        access_token: accessToken!,
        refresh_token: refreshToken!,
      });
      error = setError;
    } else {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code!);
      error = exchangeError;
    }

    if (error) {
      console.warn("Error al establecer sesión:", error.message);
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

    // 4. Éxito: Preparar URL de destino
    result.connected = true;
    result.message = "Verificado correctamente. Redirigiendo...";

    // Lógica de destino actualizada
    if (type === "recovery") {
      // Para recovery, redirigir a la página principal con indicador de recovery
      const params = new URLSearchParams();
      params.set("type", "recovery");

      // Preserve all other parameters
      url.searchParams.forEach((value, key) => {
        if (
          !["code", "access_token", "refresh_token", "type", "next"].includes(
            key
          )
        ) {
          params.set(key, value);
        }
      });

      result.redirectUrl = "/?" + params.toString();
    } else if (redirectTo) {
      // Redirigir exactamente a la URL solicitada
      result.redirectUrl = redirectTo;
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
    console.log("Type:", type);
    console.log("Redirect To Param:", redirectTo);
    console.log("Final Redirect URL:", result.redirectUrl);
    console.log("-------------------------------");
  } catch (err: any) {
    console.error("Excepción en callback:", err);
    result.message = "Ocurrió un error inesperado al procesar la solicitud.";
  }

  return result;
};
