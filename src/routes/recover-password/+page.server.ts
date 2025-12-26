import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  resolveBrand,
  hasSupabaseReservedParam,
  isSystemValid,
  validateAndNormalizeRedirectTo,
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
    const redirectTo = formData.get("redirectTo") as string;

    // Normalizar redirectTo
    const normalizedRedirectTo = validateAndNormalizeRedirectTo(redirectTo);

    // Preserve `system` from the original URL when building the
    // email redirect that Supabase will embed in the confirmation link.
    // Also check formData because the action URL might strip query params.
    const system =
      url.searchParams.get("system") || (formData.get("system") as string);

    console.log("sendRecoveryLink action called", {
      email,
      system,
      redirectTo,
      normalizedRedirectTo,
    });

    if (!system) {
      return fail(400, { error: "El parámetro 'system' es obligatorio." });
    }

    if (!email) {
      return fail(400, { error: "El correo es obligatorio." });
    }

    // Validar formato básico del correo
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return fail(400, { error: "Ingresa un correo válido." });
    }

    // En vez de depender del admin client (service role) que a veces no está
    // disponible en dev, delegamos en la API de Supabase y mapeamos errores
    // comunes a mensajes amigables.
    const supabase = createSupabaseServerClient({ request, cookies });

    try {
      // Determine the auth origin to build the reset-password URL. Prefer
      // a public env var if available, otherwise fall back to the current
      // request origin. This mirrors the runtime config used elsewhere.
      const AUTH_ORIGIN =
        process.env.PUBLIC_AUTH_ORIGIN ||
        process.env.VITE_AUTH_ORIGIN ||
        url.origin;

      let emailRedirectTo: string;

      // Build a reset-password URL that explicitly includes the `system`
      // param and the original `redirect_to` so Supabase will embed them
      // into the ConfirmationURL it sends by email.
      const params = new URLSearchParams();
      params.set("system", system);
      if (normalizedRedirectTo) params.set("redirect_to", normalizedRedirectTo);

      emailRedirectTo = `${AUTH_ORIGIN.replace(
        /\/$/,
        ""
      )}/reset-password?${params.toString()}`;

      // Use the explicit password recovery API so Supabase sends the
      // official password recovery template (NOT a magic link login).
      // This ensures the email contains the proper reset flow.
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: emailRedirectTo,
        }
      );

      if (error) {
        console.error("Error al enviar OTP de recuperación:", error);
        const msg = (error.message || "").toLowerCase();
        if (
          msg.includes("user not found") ||
          msg.includes("no user") ||
          msg.includes("not found") ||
          msg.includes("signups not allowed")
        ) {
          return fail(400, {
            email,
            error: "No encontramos una cuenta asociada a este correo.",
          });
        }

        return fail(400, {
          email,
          error:
            "No pudimos enviar el código. Inténtalo de nuevo en unos minutos.",
        });
      }
    } catch (err) {
      console.error("Error inesperado al enviar OTP de recuperación:", err);
      return fail(400, {
        email,
        error:
          "No fue posible enviar el código en este momento. Por favor inténtalo de nuevo en unos minutos.",
      });
    }

    return { success: true, email };
  },
};
