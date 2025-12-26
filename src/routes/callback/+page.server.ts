import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import {
  DEFAULT_REDIRECT_URL,
  resolveBrand,
  isRedirectUrlAllowed,
} from "$lib/brandConfig";

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

  // Validar redirectTo si está presente
  if (redirectTo && !isRedirectUrlAllowed(system, redirectTo)) {
    result.message = "URL de redirección no permitida.";
    result.connected = false;
    return result;
  }

  // Check if session already exists and redirect immediately
  const {
    data: { session: existingSession },
  } = await supabase.auth.getSession();
  if (existingSession) {
    if (redirectTo) {
      throw redirect(302, redirectTo);
    } else if (system) {
      const brandConfig = resolveBrand(system);
      throw redirect(
        302,
        brandConfig?.redirectUrlAfterLogin || DEFAULT_REDIRECT_URL
      );
    } else {
      throw redirect(302, DEFAULT_REDIRECT_URL);
    }
  }

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
    // Para SSO multi-dominio, no hacer exchange aquí; pasar el code al cliente
    result.connected = true;
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
        !["code", "access_token", "refresh_token", "type", "next"].includes(key)
      ) {
        params.set(key, value);
      }
    });

    result.redirectUrl = "/reset-password?" + params.toString();
  } else if (redirectTo) {
    // Redirigir exactamente a la URL solicitada, agregando code si aplica
    let targetUrl = redirectTo;
    if (code && type !== "recovery") {
      const separator = targetUrl.includes("?") ? "&" : "?";
      targetUrl += `${separator}code=${encodeURIComponent(code)}`;
      if (system) targetUrl += `&system=${encodeURIComponent(system)}`;
    }
    result.redirectUrl = targetUrl;
  } else {
    const brandConfig = resolveBrand(system);
    let targetUrl = brandConfig?.redirectUrlAfterLogin || DEFAULT_REDIRECT_URL;
    if (code && type !== "recovery") {
      const separator = targetUrl.includes("?") ? "&" : "?";
      targetUrl += `${separator}code=${encodeURIComponent(code)}`;
      if (system) targetUrl += `&system=${encodeURIComponent(system)}`;
    }
    result.redirectUrl = targetUrl;
  }

  console.log("--- Callback Redirect Debug ---");
  console.log("Current URL:", url.toString());
  console.log("Type:", type);
  console.log("Redirect To Param:", redirectTo);
  console.log("System Param:", system);
  console.log("Connected:", result.connected);
  console.log("Final Redirect URL:", result.redirectUrl);
  console.log("-------------------------------");

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

  // Redirect automatically if connected
  if (result.connected) {
    throw redirect(302, result.redirectUrl);
  }

  return result;
};
