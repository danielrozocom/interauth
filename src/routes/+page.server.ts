import { redirect } from "@sveltejs/kit";
import {
  resolveBrand,
  hasSupabaseReservedParam,
  isSystemValid,
  DEFAULT_REDIRECT_URL,
} from "$lib/brandConfig";
import type { PageServerLoad } from "./$types";

const SYSTEM_REDIRECTS = {
  interpos: "https://pos.interfundeoms.edu.co",
  otro: "https://loquesiga.interfundeoms.edu.co",
};

const ALLOWED_DOMAINS = [
  "https://auth.interfundeoms.edu.co",
  "https://supa.interfundeoms.edu.co",
];

export const load: PageServerLoad = async ({ url, locals }) => {
  const code = url.searchParams.get("code");
  const system = url.searchParams.get("system");
  const hasSupabaseFlow = hasSupabaseReservedParam(url.searchParams);
  const isDev = process.env.NODE_ENV === "development";

  const redirectTo = url.searchParams.get("redirectTo");
  const { session: currentSession } = await locals.safeGetSession();

  if (currentSession && redirectTo) {
    throw redirect(303, redirectTo);
  }

  // 1. Procesar intercambio de código (Sign In with Google/Magic Link)
  if (code) {
    console.log(`[Auth] Code detected for system: ${system || "unknown"}`);
    try {
      const supabase = locals.supabase;
      const { error, data } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[Auth] Code exchange failed:", error);
        return {
          authInfo: {
            valid: false,
            message:
              "El enlace ya no es válido o ha expirado. Por favor solicita uno nuevo.",
          },
        };
      }

      console.log("[Auth] Session exchanged successfully.");

      // Verificar si la sesión es válida con getUser
      // Esto asegura que safeGetSession en layout se actualice
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        console.log(`[Auth] User authenticated: ${user.email}`);
        // Normalize target for development: if target is relative use current origin,
        // and if running in dev replace production host with current origin so
        // the whole flow stays on localhost.
        const isDev = process.env.NODE_ENV === "development";
        let finalTarget = target;
        try {
          if (finalTarget.startsWith("/")) {
            finalTarget = `${url.origin}${finalTarget}`;
          } else if (isDev) {
            const parsed = new URL(finalTarget);
            // If target points to the interfundeoms domain, rewrite to current origin
            if (parsed.host && parsed.host.includes("interfundeoms")) {
              finalTarget = `${url.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
            }
          }
        } catch (e) {
          // If parsing failed, keep original target
        }

        console.log(`[Auth] Redirecting to: ${finalTarget}`);
        throw redirect(303, finalTarget);
        const redirectTo =
          url.searchParams.get("redirectTo") ||
          url.searchParams.get("redirect_to");
        const brandConfig = resolveBrand(system || "auth");
        let target = "/";

        if (redirectTo) {
          target = redirectTo;
        } else if (brandConfig && brandConfig.redirectUrlAfterLogin) {
          target = brandConfig.redirectUrlAfterLogin;
        } else {
          // Fallback a InterPOS por defecto si no hay system
          target = DEFAULT_REDIRECT_URL;
        }

        console.log(`[Auth] Redirecting to: ${target}`);
        throw redirect(303, target);
      }
    } catch (err) {
      // Si el error es una redirección, dejarlo pasar (SvelteKit funciona así)
      if ((err as any)?.status === 303 || (err as any)?.status === 307) {
        throw err;
      }

      console.error("[Auth] Unexpected error during code exchange:", err);
      return {
        authInfo: {
          valid: false,
          message: "Ocurrió un error verificando tu sesión.",
        },
      };
    }
  }

  // 2. Si NO hay código, verificar si ya hay sesión activa
  // Para redirigir automáticamente si el usuario entra a / estando logueado
  const { session } = await locals.safeGetSession();
  const type = url.searchParams.get("type");
  if (session && !code && type !== "recovery") {
    const redirectTo =
      url.searchParams.get("redirectTo") || url.searchParams.get("redirect_to");

    if (redirectTo) {
      // Normalize redirectTo similarly to ensure local flows stay local in dev
      const isDev = process.env.NODE_ENV === "development";
      let final = redirectTo;
      try {
        if (final.startsWith("/")) final = `${url.origin}${final}`;
        else if (isDev) {
          const parsed = new URL(final);
          if (parsed.host && parsed.host.includes("interfundeoms")) {
            final = `${url.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
          }
        }
      } catch (e) {
        // leave as-is
      }
      throw redirect(303, final);
    }

    // Si ya tiene sesión, y visita root, quizás queramos mandarlo al sistema por defecto o al que pida
    if (system) {
      const brandConfig = resolveBrand(system);
      if (brandConfig?.redirectUrlAfterLogin) {
        // Resolve relative/local redirect in server context using current origin
        const redir = brandConfig.redirectUrlAfterLogin;
        let final = redir;
        try {
          if (final.startsWith("/")) final = `${url.origin}${final}`;
          else if (process.env.NODE_ENV === "development") {
            const parsed = new URL(final);
            if (parsed.host && parsed.host.includes("interfundeoms")) {
              final = `${url.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
            }
          }
        } catch (e) {
          // ignore
        }
        throw redirect(303, final);
      }
    }
  }

  // Decide si este acceso es válido en base a `system` y a la presencia de parámetros de Supabase
  let brandCfg = isSystemValid(system) ? resolveBrand(system) : null;

  // En local permitimos continuar sin `system`
  if (!brandCfg && isDev) {
    brandCfg = resolveBrand("local");
  }

  // Si no es un flujo de Supabase y no hay system válido -> mostrar pantalla de acceso inválido
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
    defaultRedirect: DEFAULT_REDIRECT_URL,
  };
};
