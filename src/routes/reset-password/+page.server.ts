import type { PageServerLoad } from "./$types";
import { createSupabaseServerClient } from "$lib/supabase/serverClient";
import {
  resolveBrand,
  isSystemValid,
  DEFAULT_REDIRECT_URL,
} from "$lib/brandConfig";

export const load: PageServerLoad = async ({ url, cookies, request }) => {
  // Extract URL parameters
  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token");
  const type = url.searchParams.get("type");
  const system = url.searchParams.get("system");
  const redirectTo =
    url.searchParams.get("redirectTo") || url.searchParams.get("redirect_to");

  const isDev = process.env.NODE_ENV === "development";

  // Validate this is actually a recovery flow
  if (type !== "recovery") {
    return {
      valid: false,
      error:
        "Esta página solo es accesible desde un enlace de recuperación de contraseña.",
      system: null,
      redirectTo: null,
    };
  }

  // Check for required tokens
  if (!accessToken || !refreshToken) {
    return {
      valid: false,
      error:
        "Tokens de recuperación no encontrados. Por favor solicita un nuevo enlace.",
      system: null,
      redirectTo: null,
    };
  }

  // Create Supabase client and set session
  const supabase = createSupabaseServerClient({ request, cookies });

  try {
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (setSessionError) {
      console.error(
        "[ResetPassword] Error setting session:",
        setSessionError.message
      );
      return {
        valid: false,
        error:
          "El enlace no es válido o ha expirado. Por favor solicita uno nuevo.",
        system: null,
        redirectTo: null,
      };
    }

    // Verify session is active
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        valid: false,
        error:
          "No se pudo establecer la sesión. Por favor solicita un nuevo enlace.",
        system: null,
        redirectTo: null,
      };
    }

    // Resolve brand config
    let brandConfig = isSystemValid(system) ? resolveBrand(system) : null;
    if (!brandConfig && isDev) {
      brandConfig = resolveBrand("local");
    }

    // Determine final redirect URL after password reset
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

    console.log("[ResetPassword] Session established for:", session.user.email);
    console.log("[ResetPassword] Will redirect to:", finalRedirect);

    return {
      valid: true,
      error: null,
      system: system || null,
      redirectTo: finalRedirect,
      userEmail: session.user.email,
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
