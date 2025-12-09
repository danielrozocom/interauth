import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  resolveBrand,
  hasSupabaseReservedParam,
  isSystemValid,
} from "$lib/brandConfig";
import { createSupabaseServerClient } from "$lib/supabase/serverClient";

export const load: PageServerLoad = async ({ url }) => {
  const system = url.searchParams.get("system");
  const hasSupabaseFlow = hasSupabaseReservedParam(url.searchParams);
  const isDev = process.env.NODE_ENV === "development";

  let brandCfg = isSystemValid(system) ? resolveBrand(system) : null;

  // En local permitimos continuar sin `system`
  if (!brandCfg && isDev) {
    brandCfg = resolveBrand("local");
  }

  if (!hasSupabaseFlow && !brandCfg) {
    return {
      invalidAccess: true,
      system: system || null,
      brandConfig: null,
    };
  }

  return {
    invalidAccess: false,
    system: system || null,
    brandConfig: brandCfg,
  };
};

export const actions: Actions = {
  sendRecoveryLink: async ({ request, url, cookies }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const originalRedirectTo = formData.get("redirectTo") as string;

    if (!email) {
      return fail(400, { error: "El correo es obligatorio." });
    }

    // Validar formato básico del correo
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return fail(400, { error: "Ingresa un correo válido." });
    }

    const supabase = createSupabaseServerClient({ request, cookies });

    // Build the redirect URL for the password reset email
    // This should point to /reset-password with preserved parameters
    const system = url.searchParams.get("system");
    const resetPasswordUrl = new URL(`${url.origin}/reset-password`);
    if (system) {
      resetPasswordUrl.searchParams.set("system", system);
    }
    if (originalRedirectTo) {
      resetPasswordUrl.searchParams.set("redirect_to", originalRedirectTo);
    }

    try {
      // SECURITY: Do NOT validate if email exists before sending recovery link.
      // This prevents user enumeration attacks. Always show neutral response.
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: resetPasswordUrl.toString(),
        }
      );

      if (error) {
        // Log the full error for debugging, but NEVER expose user existence to UI
        console.error("[Recovery] Error details (internal only):", {
          message: error.message,
          status: (error as any).status,
          code: (error as any).code,
          email: email, // Log email for internal debugging
        });

        const msg = (error.message || "").toLowerCase();
        const status = (error as any).status;
        const code = (error as any).code;

        // Handle rate limit error - status 429 or specific code
        // This is safe to expose since it doesn't reveal user existence
        if (
          status === 429 ||
          code === "over_email_send_rate_limit" ||
          msg.includes("rate limit") ||
          msg.includes("you can only request this after")
        ) {
          console.log("[Recovery] Rate limit hit for email:", email);
          return fail(429, {
            error:
              "Has solicitado demasiados intentos. Inténtalo de nuevo en unos segundos.",
            isRateLimit: true,
          });
        }

        // For ALL other errors (including "user not found", "invalid email", etc.)
        // show the SAME neutral success message to prevent user enumeration
        // The actual error is already logged above for debugging
        console.log("[Recovery] Returning neutral response for:", email);
      } else {
        console.log("[Recovery] Reset email sent successfully to:", email);
      }

      // SECURITY: Always return success with neutral message
      // This prevents attackers from discovering which emails are registered
    } catch (err) {
      // Network or server error - this is safe to show as it doesn't reveal user info
      console.error("[Recovery] Unexpected error:", err);
      return fail(500, {
        error:
          "Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo más tarde.",
      });
    }

    // Always return success with neutral message (handled in frontend)
    return { success: true };
  },
};
