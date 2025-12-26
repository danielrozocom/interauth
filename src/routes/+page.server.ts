import { redirect } from "@sveltejs/kit";
import {
  resolveBrand,
  hasSupabaseReservedParam,
  isSystemValid,
  DEFAULT_REDIRECT_URL,
  isRedirectUrlAllowed,
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

export const load: PageServerLoad = async ({ url, locals, cookies }) => {
  const code = url.searchParams.get("code");
  const system = url.searchParams.get("system");
  const hasSupabaseFlow = hasSupabaseReservedParam(url.searchParams);
  const isDev = process.env.NODE_ENV === "development";

  const redirectTo = url.searchParams.get("redirectTo");
  const { session: currentSession } = await locals.safeGetSession();

  // Si hay redirectTo, guardarlo y redirigir a URL limpia
  if (redirectTo) {
    // Validar que sea URL absoluta http/https
    try {
      const parsed = new URL(redirectTo);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return {
          error: "URL de redirección debe ser http o https.",
          system,
        };
      }
    } catch {
      return {
        error: "URL de redirección inválida.",
        system,
      };
    }
    // Guardar en cookie por 5 minutos
    cookies.set("pending_redirect", redirectTo, {
      path: "/",
      httpOnly: true,
      secure: !isDev,
      maxAge: 300,
    });
    // Redirigir a URL limpia
    throw redirect(303, `/?system=${system || ""}`);
  }

  // 2. Si NO hay código, verificar si ya hay sesión activa
  // Para redirigir automáticamente si el usuario entra a / estando logueado
  const { session } = await locals.safeGetSession();
  const type = url.searchParams.get("type");
  if (session && !code && type !== "recovery") {
    const pendingRedirect = cookies.get("pending_redirect");
    if (pendingRedirect) {
      cookies.delete("pending_redirect");
      throw redirect(303, pendingRedirect);
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
