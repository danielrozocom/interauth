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
  // NO REDIRIGIR ANTES DE COMPLETAR EL EXCHANGE
  if (type === "recovery") {
    // For recovery links we do NOT establish a session here. Instead we
    // forward the tokens to `/reset-password` and let that route handle
    // the password reset UI. This avoids treating recovery as a magic
    // link login flow.
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
    // For non-recovery flows we still need to exchange the code and
    // establish a session (OAuth / sign-in). For recovery we purposely
    // skip session establishment to keep this flow focused on password
    // reset rather than login.
    let error = null;
    if (type !== "recovery") {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code!);
      error = exchangeError;
      if (error) {
        console.warn("Error al establecer sesión:", error.message);
        // Redirigir a /error con detalles del fallo OAuth
        const errorParams = new URLSearchParams();
        errorParams.set("error", "oauth_failed");
        errorParams.set(
          "description",
          error.message || "OAuth exchange failed"
        );
        if (system) errorParams.set("system", system);
        result.redirectUrl = "/error?" + errorParams.toString();
        result.connected = false;
        result.message =
          error.message || "El enlace no es válido o ha expirado.";
        return result;
      }

      // Verify session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        result.message =
          "No se pudo establecer la sesión. Intenta iniciar sesión manualmente.";
        return result;
      }
    }

    // 4. Éxito: Preparar URL de destino
    result.connected = true;
    result.message = "Verificado correctamente. Redirigiendo...";

    // LÓGICA DE REDIRECCIÓN - Garantiza que siempre hay un redirectUrl válido
    if (type === "recovery") {
      // For recovery, redirect to the dedicated reset-password page
      const params = new URLSearchParams();
      params.set("type", "recovery");
      if (accessToken) params.set("access_token", accessToken);
      if (refreshToken) params.set("refresh_token", refreshToken);

      // Preserve other parameters (system, redirect_to, etc.)
      url.searchParams.forEach((value, key) => {
        if (
          !["code", "access_token", "refresh_token", "type", "next"].includes(
            key
          )
        ) {
          params.set(key, value);
        }
      });

      result.redirectUrl = "/reset-password?" + params.toString();
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
    console.log("System Param:", system);
    console.log("Connected:", result.connected);
    console.log("Final Redirect URL:", result.redirectUrl);
    console.log("-------------------------------");
  } catch (err: any) {
    console.error("Excepción en callback:", err);
    result.message = "Ocurrió un error inesperado al procesar la solicitud.";
  }

  // Verificar que siempre hay un redirectUrl válido
  if (result.connected && !result.redirectUrl) {
    console.warn(
      "⚠️ Connected=true pero sin redirectUrl. Asignando valor por defecto: /"
    );
    result.redirectUrl = "/";
  }

  console.log("📤 Retornando result al cliente:", {
    connected: result.connected,
    redirectUrl: result.redirectUrl,
    message: result.message,
  });

  return result;
};
