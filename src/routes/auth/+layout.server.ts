/**
 * Layout Server Load Function for Auth Routes
 *
 * Este archivo maneja la lógica del lado del servidor para las rutas de auth.
 * Permite que rutas con code no requieran system parameter.
 */

import { error, redirect } from "@sveltejs/kit";
import { resolveBrand, type BrandConfig } from "$lib/brandConfig";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({
  url,
  locals: { safeGetSession },
  cookies,
}) => {
  const { session, user } = await safeGetSession();

  // Extraer el parámetro 'system' de la URL
  const systemParam = url.searchParams.get("system") || "app";

  // Resolver la configuración del brand
  const brandConfig = resolveBrand(systemParam);

  // Si no existe la configuración, retornar error
  if (!brandConfig) {
    throw error(400, "Invalid system configuration");
  }

  // Retornar los datos al cliente
  return {
    system: systemParam,
    brandConfig: brandConfig as BrandConfig,
    // Exponer la URL de Supabase al cliente para construir flujos de OAuth
    supabaseUrl: process.env.SUPABASE_URL || null,
    appName: process.env.APP_NAME || null,
    session,
    user,
    cookies: cookies.getAll(),
  };
};