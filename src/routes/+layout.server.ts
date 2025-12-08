/**
 * Layout Server Load Function
 *
 * Este archivo maneja la lógica del lado del servidor para el layout raíz.
 * Extrae el parámetro 'system' de la URL y resuelve la configuración del brand.
 */

import { error, redirect } from "@sveltejs/kit";
import { resolveBrand, type BrandConfig } from "$lib/brandConfig";
import type { LayoutServerLoad } from "./$types";
import { env } from "$env/dynamic/private";

export const load: LayoutServerLoad = async ({
  url,
  locals: { safeGetSession },
  cookies,
}) => {
  const { session, user } = await safeGetSession();

  // Extraer el parámetro 'system' de la URL
  let systemParam = url.searchParams.get("system");

  // Si no hay sistema, asumimos que es el portal de autenticación propio ("auth")
  // Esto maneja automáticamente los casos de ?code= sin system, o visitas directas.
  if (!systemParam) {
    systemParam = "auth";
  }

  // Resolver la configuración del brand
  let brandConfig = resolveBrand(systemParam);

  // Si la configuración no existe (ej: ?system=invalido), fallar suavemente a "auth"
  if (!brandConfig) {
    console.warn(`System '${systemParam}' not found, defaulting to 'auth'`);
    brandConfig = resolveBrand("auth");
  }

  // Si incluso 'auth' falla (no debería), entonces sí redirigimos o error fatal
  if (!brandConfig) {
    // Fallback de última instancia
    throw redirect(307, "https://interfundeoms.edu.co");
  }

  // Resolve Supabase config for client (runtime support)
  const supabaseUrl = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  // Retornar los datos al cliente
  return {
    system: systemParam,
    brandConfig: brandConfig as BrandConfig,
    // Pass runtime config to client
    supabaseUrl,
    supabaseAnonKey,
    session,
    user,
    cookies: cookies.getAll(),
  };
};
