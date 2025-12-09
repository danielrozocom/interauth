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

    // Paso 1: Validar que el usuario exista usando el cliente admin
    try {
      const adminClient = createSupabaseAdminClient();
      const { data: userData, error: userError } =
        await adminClient.auth.admin.getUserByEmail(email.trim());

      if (userError || !userData?.user) {
        return fail(400, {
          error: "No encontramos una cuenta asociada a este correo.",
        });
      }
    } catch (error) {
      console.error("Error al verificar usuario:", error);
      return fail(500, {
        error: "Error al verificar el correo. Intenta nuevamente.",
      });
    }

    // Paso 2: Si el usuario existe, enviar el email de recuperación
    const supabase = createSupabaseServerClient({ request, cookies });

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo || `${url.origin}/callback`,
    });

    if (error) {
      console.error("Error al enviar email de recuperación:", error);
      return fail(400, {
        error:
          "No se pudo enviar el código de verificación. Intenta nuevamente.",
      });
    }

    return { success: true };
  },
};
