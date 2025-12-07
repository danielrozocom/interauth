import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const system = url.searchParams.get("system");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Verificar que la sesión se haya creado
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Determinar la URL de redirección
        let redirectUrl: string;

        // Si next existe y no es el origen de InterAuth ni "/", respétalo
        if (next && next !== process.env.AUTH_ORIGIN && next !== "/") {
          redirectUrl = next;
        } else {
          // Fallback basado en system
          if (system === "pos") {
            redirectUrl = process.env.POS_URL || "/";
          } else if (system === "app") {
            redirectUrl = process.env.APP_URL || "/";
          } else {
            // Fallback final: raíz de InterAuth
            redirectUrl = "/";
          }
        }

        throw redirect(303, redirectUrl);
      }
    }
  }

  // En caso de error, redirigir a página de error
  throw redirect(303, "/auth/auth-code-error");
};
