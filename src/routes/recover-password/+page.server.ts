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

    // Enviar email de recuperación
    // Nota: Supabase no revelará si el email existe o no por seguridad
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo || `${url.origin}/callback`,
    });

    if (error) {
      console.error("Error al enviar email de recuperación:", error);
      // Mensaje sutil por seguridad
      return fail(400, {
        error:
          "Si el correo está registrado, recibirás un código de verificación.",
      });
    }

    // Siempre retornar éxito para no filtrar información
    return { success: true };
  },
};
