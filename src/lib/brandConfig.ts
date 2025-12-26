/**
 * Brand Configuration
 *
 * Este archivo define la configuración de todos los sistemas/brands
 * que pueden usar este intermediario de autenticación.
 *
 * Para agregar un nuevo sistema:
 * 1. Agrega una nueva entrada en BRAND_CONFIG con su clave única
 * 2. Define nombre, color principal y URL de redirect
 * 3. Asegúrate de que la redirectUrlAfterLogin esté en GOTRUE_URI_ALLOW_LIST
 */

export interface BrandConfig {
  /** Nombre visible del sistema */
  name: string;
  /** Color principal en formato hex (ej: #35528C) */
  primaryColor: string;
  /** URL a donde redirigir después del login exitoso */
  redirectUrlAfterLogin: string;
  /** Lista de URLs permitidas para redirectTo, soporta wildcards como *.domain.com */
  allowedRedirectUrls: string[];
  /** URL opcional del logo (favicon/logo que se muestra en la tarjeta) */
  logoUrl?: string;
  /** Subtítulo opcional que aparece debajo del nombre en la pantalla de login */
  subtitle?: string;
  /** Texto del botón de login con correo */
  loginButtonText?: string;
  /** Texto del botón de login con Google */
  googleButtonText?: string;
  /** Texto del enlace de recuperación de contraseña */
  forgotPasswordText?: string;
}

/**
 * Mapa de configuraciones de sistemas
 * Agrega nuevos sistemas aquí según sea necesario
 */
const BRAND_CONFIG: Record<string, BrandConfig> = {
  // Local development (no system param needed)
  local: {
    name: "InterAuth Local",
    primaryColor: "#35528C",
    // Use a relative redirect in local config; the server/client will
    // resolve this against the current origin so we don't hardcode ports.
    redirectUrlAfterLogin: "/",
    allowedRedirectUrls: ["http://localhost:*", "https://localhost:*"],
    subtitle: "Login",
  },
  // The auth UI itself (used when ?system=auth or no system provided)
  auth: {
    name: "InterAuth",
    primaryColor: "#35528C",
    redirectUrlAfterLogin: "/",
    allowedRedirectUrls: ["https://auth.interfundeoms.edu.co"],
    subtitle: "Authentication",
  },
  // InterPOS
  pos: {
    name: "InterPOS",
    primaryColor: "#35528C",
    redirectUrlAfterLogin: "https://pos.interfundeoms.edu.co/",
    allowedRedirectUrls: [
      "https://pos.interfundeoms.edu.co",
      "https://pos.otrodominio.com",
    ],
    subtitle: "Login",
  },

  // InterAPP
  app: {
    name: "InterAPP",
    primaryColor: "#35528C",
    redirectUrlAfterLogin: "https://app.interfundeoms.edu.co",
    allowedRedirectUrls: [
      "https://*.trycloudflare.com",
      "https://app.interfundeoms.edu.co",
    ],
    subtitle: "Login",
  },
};

/**
 * Color por defecto si no se especifica uno
 */
export const DEFAULT_PRIMARY_COLOR = "#35528C";

/**
 * Resumen mínimo de un sistema (para listados)
 */
export interface BrandSummary {
  key: string;
  name: string;
  primaryColor: string;
}

/**
 * Devuelve una lista de sistemas disponibles con su color primario
 */
export function getAvailableSystemsWithColors(): BrandSummary[] {
  return Object.entries(BRAND_CONFIG).map(([key, cfg]) => ({
    key,
    name: cfg.name,
    primaryColor: cfg.primaryColor || DEFAULT_PRIMARY_COLOR,
  }));
}

/**
 * Mapa de aliases para aceptar variantes en el parámetro `system`
 * Permite que valores como `interpos` o `pos-prod` apunten a la misma configuración
 */
const BRAND_ALIASES: Record<string, string> = {
  // comunes
  interpos: "pos",
  pos: "pos",
  interapp: "app",
  app: "app",
  local: "local",
  dev: "local",
  localhost: "local",
};

/**
 * Resuelve la configuración de un sistema
 *
 * @param system - Identificador del sistema (ej: 'interpos', 'admin', 'tienda')
 * @returns La configuración del sistema o null si no existe
 */
export function resolveBrand(
  system: string | null | undefined
): BrandConfig | null {
  if (!system) {
    return null;
  }

  const key = system.toLowerCase().trim();

  // Intentar búsqueda directa
  let config = BRAND_CONFIG[key];

  // Si no existe, intentar resolver via alias
  if (!config) {
    const target = BRAND_ALIASES[key];
    if (target) {
      config = BRAND_CONFIG[target];
    }
  }

  if (!config) {
    return null;
  }

  // Asegurar que siempre haya un color principal
  return {
    ...config,
    primaryColor: config.primaryColor || DEFAULT_PRIMARY_COLOR,
  };
}

/**
 * Convierte un patrón con wildcard a una expresión regular
 * Ej: "*.domain.com" -> /^https?:\/\/.*\.domain\.com(\/.*)?$/
 */
function patternToRegex(pattern: string): RegExp {
  // Escapar caracteres especiales
  let regex = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Reemplazar \* con .*
  regex = regex.replace(/\\\*/g, ".*");
  // Para localhost:*, reemplazar :* con :\d+
  regex = regex.replace(/:\\\*/, ":\\d+");
  // Agregar ^ y $ para match completo
  regex = `^${regex}(\\/.*)?$`;
  return new RegExp(regex, "i"); // case insensitive
}

/**
 * Valida si una URL está permitida para un sistema dado
 * @param system - El sistema
 * @param url - La URL a validar
 * @returns true si está permitida
 */
export function isRedirectUrlAllowed(
  system: string | null | undefined,
  url: string
): boolean {
  const config = resolveBrand(system);
  if (!config) return false;

  try {
    const parsedUrl = new URL(url);
    const isDev = process.env.NODE_ENV === "development";

    // Rechazar HTTP a menos que sea dev
    if (parsedUrl.protocol !== "https:" && !isDev) {
      return false;
    }

    // Verificar contra allowedRedirectUrls
    for (const pattern of config.allowedRedirectUrls) {
      const regex = patternToRegex(pattern);
      if (regex.test(url)) {
        return true;
      }
    }

    // Permitir redirecciones a subdominios de trycloudflare.com
    if (
      parsedUrl.hostname.match(/^[a-zA-Z0-9-]+\.trycloudflare\.com$/) &&
      parsedUrl.protocol === "https:"
    ) {
      return true;
    }

    return false;
  } catch {
    // URL inválida
    return false;
  }
}

/**
 * Lista blanca de parámetros que forman parte de los flujos de Supabase (GoTrue / OAuth / Magic Links)
 * Si cualquiera de estos parámetros está presente en la URL, no exigimos `system`
 */
export const SUPABASE_RESERVED_PARAMS = [
  "code",
  "token",
  "type",
  "redirect_to",
  "provider",
];

/**
 * Comprueba si la colección de searchParams incluye alguno de los parámetros reservados
 */
export function hasSupabaseReservedParam(
  searchParams: URLSearchParams | null | undefined
): boolean {
  if (!searchParams) return false;
  return SUPABASE_RESERVED_PARAMS.some((p) => searchParams.has(p));
}

/**
 * Comprueba si un sistema (string) resuelve a una configuración válida
 */
export function isSystemValid(system: string | null | undefined): boolean {
  if (!system) return false;
  return resolveBrand(system) !== null;
}

/**
 * Lista de todos los sistemas disponibles
 */
export function getAvailableSystems(): string[] {
  return Object.keys(BRAND_CONFIG);
}

/**
 * URL de redirección por defecto si no se especifica ninguna otra
 */
export const DEFAULT_REDIRECT_URL =
  process.env.NODE_ENV === "development"
    ? "/"
    : "https://pos.interfundeoms.edu.co";
