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

  const brandCfg = isSystemValid(system) ? resolveBrand(system) : null;

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

    if (!email) {
      return fail(400, { error: "El correo es obligatorio." });
    }

    const supabase = createSupabaseServerClient({ request, cookies });

    // Verificación ligera: usar signInWithOtp para comprobar si el usuario existe
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    if (otpError) {
      // Capturar errores de usuario no encontrado
      if (
        otpError.message.toLowerCase().includes("user not found") ||
        otpError.message.toLowerCase().includes("user does not exist") ||
        otpError.message
          .toLowerCase()
          .includes("not allowed to log in with otp")
      ) {
        return fail(400, {
          error: "El correo no está registrado",
        });
      } else {
        return fail(400, { error: otpError.message });
      }
    }

    // Si la verificación OTP fue exitosa, el usuario existe, proceder con envío del enlace de recuperación
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo || `${url.origin}/callback`,
    });

    if (error) {
      return fail(400, { error: error.message });
    }

    return { success: true };
  },
};
