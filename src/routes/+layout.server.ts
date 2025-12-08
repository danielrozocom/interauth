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
  const systemParam = url.searchParams.get("system");

  // System parameter is always required
  if (!systemParam) {
    throw error(400, "System parameter is required");
  }

  // Resolver la configuración del brand
  const brandConfig = resolveBrand(systemParam);

  // Si no existe la configuración, retornar error
  if (!brandConfig) {
    // Si el 'system' no está configurado, redirigimos al dominio principal
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
