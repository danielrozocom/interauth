import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const SYSTEM_REDIRECTS = {
  interpos: "https://pos.interfundeoms.edu.co",
  otro: "https://loquesiga.interfundeoms.edu.co",
};

const DEFAULT_REDIRECT = "https://pos.interfundeoms.edu.co";

const ALLOWED_DOMAINS = [
  "https://auth.interfundeoms.edu.co",
  "https://supa.interfundeoms.edu.co",
];

export const load: PageServerLoad = async ({ url, locals }) => {
  const code = url.searchParams.get("code");
  // const system = url.searchParams.get("system"); // We might use this for UI context but not for redirecting away
  // const redirectTo = url.searchParams.get("redirect_to"); // Ignore for auto-redirect

  // 1. Si no hay código, carga normal
  if (!code) {
    return {};
  }

  // 2. Procesar el código silenciosamente
  let authInfo = {
    valid: false,
    message: "",
    event: url.searchParams.get("type") || "login", // 'recovery', 'signup', 'invite', 'magiclink'
  };

  try {
    const supabase = locals.supabase;
    // Intentar intercambiar el código.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.warn("Auth code invalid:", error.message);
      authInfo.valid = false;
      authInfo.message =
        "El enlace ya no es válido o ha expirado. Por favor solicita uno nuevo.";
    } else {
      console.log("✅ Auth code exchanged successfully");
      authInfo.valid = true;
      authInfo.message = "Verificado correctamente.";

      // Si el código no tenía type, asumimos login.
      // Si Supabase devuelve sesión, el usuario está logueado.
    }
  } catch (err) {
    console.warn("Unexpected auth error:", err);
    authInfo.valid = false;
    authInfo.message = "No pudimos verificar el enlace. Intenta de nuevo.";
  }

  // 3. Retornar carga normal con info de auth
  return {
    authInfo,
  };
};
