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

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo || `${url.origin}/callback`,
    });

    if (error) {
      // Check if the error indicates the email is not registered
      if (
        error.message.toLowerCase().includes("user not found") ||
        error.message.toLowerCase().includes("invalid email") ||
        error.message.toLowerCase().includes("email not found")
      ) {
        return fail(400, {
          error: "El correo no está registrado",
        });
      } else {
        return fail(400, { error: error.message });
      }
    }

    return { success: true };
  },
};
