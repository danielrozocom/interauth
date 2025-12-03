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
}

/**
 * Mapa de configuraciones de sistemas
 * Agrega nuevos sistemas aquí según sea necesario
 */
const BRAND_CONFIG: Record<string, BrandConfig> = {
  // InterPOS
  pos: {
    name: "InterPOS",
    primaryColor: "#35528C",
    redirectUrlAfterLogin: "https://pos.interfundeoms.edu.co/auth/callback",
  },
  // Alias for legacy identifier `interpos` used in query params and docs
  interpos: {
    name: "InterPOS",
    primaryColor: "#35528C",
    redirectUrlAfterLogin: "https://pos.interfundeoms.edu.co/auth/callback",
  },
  // InterAPP
  app: {
    name: "InterAPP",
    primaryColor: "#35528C",
    redirectUrlAfterLogin: "https://app.interfundeoms.edu.co/auth/callback",
  },
};

/**
 * Color por defecto si no se especifica uno
 */
const DEFAULT_PRIMARY_COLOR = "#35528C";

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

  const config = BRAND_CONFIG[system.toLowerCase()];

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
 * Lista de todos los sistemas disponibles
 */
export function getAvailableSystems(): string[] {
  return Object.keys(BRAND_CONFIG);
}
