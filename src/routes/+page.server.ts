import { redirect } from "@sveltejs/kit";

const SYSTEM_REDIRECTS = {
  interpos: "https://pos.interfundeoms.edu.co",
  interfundeoms: "https://interfundeoms.edu.co",
  otro: "https://loquesiga.interfundeoms.edu.co",
};

const DEFAULT_REDIRECT = "https://interfundeoms.edu.co";

const ALLOWED_DOMAINS = [
  "https://interfundeoms.edu.co",
  "https://auth.interfundeoms.edu.co",
  "https://supa.interfundeoms.edu.co",
];

export async function load({ url, locals }) {
  const code = url.searchParams.get("code");
  const system = url.searchParams.get("system");
  const redirectTo = url.searchParams.get("redirect_to");

  if (!code) {
    // No hay código de autenticación, cargar la página de login normalmente
    return {};
  }

  // Procesar el código de autenticación
  const supabase = locals.supabase;

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error al intercambiar código por sesión:", error);
      return {
        error:
          "Error al procesar la autenticación. Verifica el enlace o inténtalo de nuevo.",
      };
    }

    // Sesión creada exitosamente, determinar la URL de redirección
    let finalUrl = DEFAULT_REDIRECT;

    const systemKey = system as keyof typeof SYSTEM_REDIRECTS;
    if (systemKey && SYSTEM_REDIRECTS[systemKey]) {
      finalUrl = SYSTEM_REDIRECTS[systemKey];
    } else if (redirectTo) {
      // Validar que el redirect_to esté en dominios permitidos y no cause loop
      try {
        const redirectUrl = new URL(redirectTo);
        const fullDomain = `${redirectUrl.protocol}//${redirectUrl.host}`;

        if (
          ALLOWED_DOMAINS.includes(fullDomain) &&
          fullDomain !== "https://auth.interfundeoms.edu.co"
        ) {
          finalUrl = redirectTo;
        }
      } catch (e) {
        // URL inválida, usar default
        console.warn("URL de redirección inválida:", redirectTo);
      }
    }

    // Redirigir al destino final
    throw redirect(302, finalUrl);
  } catch (err: any) {
    if (err?.status === 302) {
      // Es el redirect intencional, relanzar
      throw err;
    }
    console.error("Error inesperado en la autenticación:", err);
    return {
      error:
        "Error inesperado durante la autenticación. Contacta al soporte si persiste.",
    };
  }
}
