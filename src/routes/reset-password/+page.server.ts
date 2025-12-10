import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { resolveBrand, isSystemValid } from "$lib/brandConfig";

export const load: PageServerLoad = async ({ url, locals }) => {
  const code = url.searchParams.get("code");
  const system = url.searchParams.get("system");
  const redirectTo =
    url.searchParams.get("redirect_to") || url.searchParams.get("redirectTo");

  // Check for Supabase error params in URL
  const errorParam = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  let session = null;
  let error = null;

  if (errorParam || errorCode || errorDescription) {
    if (
      errorCode === "otp_expired" ||
      errorDescription?.includes("expired") ||
      errorDescription?.includes("invalid")
    ) {
      error =
        "Este enlace de recuperación ya no es válido o ha expirado. Para continuar, solicita un nuevo enlace de recuperación de contraseña.";
    } else {
      error = errorDescription || "Enlace no válido.";
    }
  } else if (code) {
    // 1. Try to exchange code if present (PKCE flow)
    const { data, error: exchangeError } =
      await locals.supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      error =
        "Este enlace de recuperación ya no es válido o ha expirado. Para continuar, solicita un nuevo enlace de recuperación de contraseña.";
    } else {
      session = data.session;
    }
  } else {
    // 2. If no code, check for existing session (e.g. page refresh)
    const { session: existingSession } = await locals.safeGetSession();
    session = existingSession;
  }

  // 3. Validate session
  if (!session) {
    // If we had a code and failed, error is already set.
    // If we didn't have a code, set error.
    if (!code) {
      error =
        "Este enlace de recuperación ya no es válido o ha expirado. Para continuar, solicita un nuevo enlace de recuperación de contraseña.";
    }
  }

  // Resolve brand config for UI
  let brandConfig = null;
  if (system && isSystemValid(system)) {
    brandConfig = resolveBrand(system);
  } else {
    brandConfig = resolveBrand("auth");
  }

  return {
    valid: !!session && !error,
    error,
    system,
    redirectTo,
    brandConfig,
    userEmail: session?.user?.email,
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const password = formData.get("password") as string;
    const system = formData.get("system") as string;
    const redirectTo = formData.get("redirect_to") as string;

    if (!password) {
      return fail(400, {
        error: "La contraseña es requerida",
        valid: true,
        system,
        redirectTo,
      });
    }

    const { error } = await locals.supabase.auth.updateUser({ password });

    if (error) {
      let errorMessage = error.message;
      const msg = errorMessage.toLowerCase();

      if (
        msg.includes("different from") ||
        msg.includes("same as") ||
        msg.includes("should be different")
      ) {
        errorMessage = "La nueva contraseña no puede ser igual a la anterior.";
      } else if (msg.includes("password should be")) {
        errorMessage =
          "La contraseña no cumple con los requisitos de seguridad.";
      }

      return fail(500, {
        error: errorMessage,
        valid: true,
        system,
        redirectTo,
      });
    }

    // Redirect
    let target = redirectTo || "/";

    // Ensure system param is preserved if needed
    if (system && target.startsWith("http")) {
      try {
        const url = new URL(target);
        if (!url.searchParams.has("system")) {
          url.searchParams.set("system", system);
          target = url.toString();
        }
      } catch (e) {
        // Ignore invalid URL parsing
      }
    }

    return {
      success: true,
      redirectTo: target,
    };
  },
};
