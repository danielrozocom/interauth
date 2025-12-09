import type { PageServerLoad } from "./$types";
import { createSupabaseServerClient } from "$lib/supabase/serverClient";
import {
  resolveBrand,
  isSystemValid,
  DEFAULT_REDIRECT_URL,
} from "$lib/brandConfig";

export const load: PageServerLoad = async ({ url, cookies, request }) => {
  // Extract URL parameters - support both PKCE and legacy flows
  const code = url.searchParams.get("code") || url.searchParams.get("token");
  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token");
  const type = url.searchParams.get("type");
  const system = url.searchParams.get("system");
  const redirectTo =
    url.searchParams.get("redirectTo") || url.searchParams.get("redirect_to");

  const isDev = process.env.NODE_ENV === "development";

  // Determine which flow we're using
  const hasPkceCode = !!code;
  const hasLegacyTokens = type === "recovery" && accessToken && refreshToken;

  // Must have either PKCE code or legacy tokens
  if (!hasPkceCode && !hasLegacyTokens) {
    return {
      valid: false,
      error:
        "Esta página solo es accesible desde un enlace de recuperación de contraseña.",
      system: null,
      redirectTo: null,
    };
  }

  // Create Supabase client
  const supabase = createSupabaseServerClient({ request, cookies });

  try {
    let sessionError: Error | null = null;

    if (hasPkceCode) {
      // PKCE flow: exchange code for session
      console.log("[ResetPassword] Processing PKCE code flow...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error(
          "[ResetPassword] exchangeCodeForSession error:",
          error.message
        );
        sessionError = error;
      } else {
        console.log(
          "[ResetPassword] PKCE code exchanged successfully for:",
          data.session?.user?.email
        );
      }
    } else if (hasLegacyTokens) {
      // Legacy flow: set session with tokens
      console.log("[ResetPassword] Processing legacy token flow...");
      const { error } = await supabase.auth.setSession({
        access_token: accessToken!,
        refresh_token: refreshToken!,
      });
      if (error) {
        console.error("[ResetPassword] setSession error:", error.message);
        sessionError = error;
      }
    }

    if (sessionError) {
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
