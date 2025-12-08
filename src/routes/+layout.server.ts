/**
 * Layout Server Load Function
 *
 * Este archivo maneja la lógica del lado del servidor para el layout raíz.
 * Extrae el parámetro 'system' de la URL y resuelve la configuración del brand.
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

  // Retornar los datos al cliente
  return {
    system: systemParam,
    brandConfig: brandConfig as BrandConfig,
    // session and user are enough for the layout
    session,
    user,
    cookies: cookies.getAll(),
  };
};
