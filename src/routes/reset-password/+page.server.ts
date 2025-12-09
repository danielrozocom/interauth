import type { PageServerLoad } from "./$types";
import { createSupabaseServerClient } from "$lib/supabase/serverClient";
import {
  resolveBrand,
  isSystemValid,
  DEFAULT_REDIRECT_URL,
} from "$lib/brandConfig";

export const load: PageServerLoad = async ({ url, cookies, request }) => {
  // Extract URL parameters - support both PKCE and legacy flows
  try {
    const code = url.searchParams.get("code") || url.searchParams.get("token");
    const accessToken = url.searchParams.get("access_token");
    const refreshToken = url.searchParams.get("refresh_token");
    const type = url.searchParams.get("type");
    const system = url.searchParams.get("system");
    const redirectTo =
      url.searchParams.get("redirectTo") || url.searchParams.get("redirect_to");

    const isDev = process.env.NODE_ENV === "development";

    // This route is exclusively for password recovery. Reject any non-recovery
    // flows (e.g. PKCE / OAuth sign-in or magic-link sign-in) to avoid
    // treating reset links as authentication flows.
    if (type !== "recovery") {
      return {
        valid: false,
        error:
          "Esta página solo es accesible desde un enlace de recuperación de contraseña.",
        system: null,
        redirectTo: null,
      };
    }

    // Ensure tokens are present (we expect legacy recovery tokens). We do NOT
    // establish a server-side session here; the browser will set the session
    // temporarily to allow updating the password and then the app will clear
    // it. This prevents treating recovery as a login flow.
    if (!accessToken || !refreshToken) {
      return {
        valid: false,
        error: "Tokens de recuperación no encontrados en la URL.",
        system: null,
        redirectTo: null,
      };
    }

    // Resolve brand config
    let brandConfig = isSystemValid(system) ? resolveBrand(system) : null;
    if (!brandConfig && isDev) {
      brandConfig = resolveBrand("local");
    }

    // Determine final redirect URL after password reset (preserve redirect_to)
    let finalRedirect =
      redirectTo || brandConfig?.redirectUrlAfterLogin || DEFAULT_REDIRECT_URL;

    // In development, rewrite production URLs to localhost
    if (isDev && finalRedirect) {
      try {
        const parsed = new URL(finalRedirect);
        if (parsed.host && parsed.host.includes("interfundeoms")) {
          finalRedirect = `${url.origin}${parsed.pathname}${parsed.search}`;
        }
      } catch {
        // If parsing fails, keep as-is
      }
    }

    // We intentionally do not resolve the user's email here (would require a
    // server-side session). The client will set the provided tokens temporarily
    // to perform the password update.
    return {
      valid: true,
      error: null,
      system: system || null,
      redirectTo: finalRedirect,
      userEmail: null,
      brandConfig,
    };
  } catch (err: any) {
    console.error("[ResetPassword] Unexpected error:", err);
    return {
      valid: false,
      error: "Ocurrió un error inesperado. Por favor solicita un nuevo enlace.",
      system: null,
      redirectTo: null,
    };
  }
};
