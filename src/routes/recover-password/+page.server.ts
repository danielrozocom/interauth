import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  resolveBrand,
  hasSupabaseReservedParam,
  isSystemValid,
} from "$lib/brandConfig";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "$lib/supabase/serverClient";

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

    // Check if user exists using signInWithOtp with shouldCreateUser: false
    // This returns a clear error if the user doesn't exist
    try {
      const tempClient = createSupabaseServerClient({ request, cookies });
      const { error: otpError } = await tempClient.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
        },
      });

      // If there's an error, check if it indicates user doesn't exist
      if (otpError) {
        const msg = otpError.message?.toLowerCase() || "";
        if (
          msg.includes("signups not allowed") ||
          msg.includes("user not found") ||
          msg.includes("no user")
        ) {
          console.log("[Recovery] User not found for email:", email);
          return fail(400, {
            error: "No encontramos una cuenta asociada a este correo.",
          });
        }
        // Other errors (rate limit, etc) - just log and continue
        console.warn("[Recovery] OTP check returned error:", msg);
      }
      // If no error, user exists - OTP was sent but we won't use it
      console.log("[Recovery] User verified for email:", email);
    } catch (checkErr: any) {
      console.warn("[Recovery] User check failed:", checkErr.message);
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
      // Use resetPasswordForEmail instead of signInWithOtp
      // This sends a password reset link, not an OTP code
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: resetPasswordUrl.toString(),
        }
      );

      if (error) {
        console.error("Error al enviar enlace de recuperación:", error);
        const msg = (error.message || "").toLowerCase();
        if (
          msg.includes("user not found") ||
          msg.includes("no user") ||
          msg.includes("not found") ||
          msg.includes("signups not allowed")
        ) {
          return fail(400, {
            error: "No encontramos una cuenta asociada a este correo.",
          });
        }

        return fail(400, {
          error:
            "No pudimos enviar el enlace. Inténtalo de nuevo en unos minutos.",
        });
      }
    } catch (err) {
      console.error("Error inesperado al enviar enlace de recuperación:", err);
      return fail(400, {
        error:
          "No fue posible enviar el enlace en este momento. Por favor inténtalo de nuevo en unos minutos.",
      });
    }

    return { success: true };
  },
};
