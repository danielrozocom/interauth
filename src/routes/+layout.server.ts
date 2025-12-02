/**
 * Layout Server Load Function
 * 
 * Este archivo maneja la lógica del lado del servidor para el layout raíz.
 * Extrae el parámetro 'system' de la URL y resuelve la configuración del brand.
 */

import { error } from '@sveltejs/kit';
import { resolveBrand, type BrandConfig } from '$lib/brandConfig';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
  // Extraer el parámetro 'system' de la URL
  const systemParam = url.searchParams.get('system');

  // Validar que el parámetro exista
  if (!systemParam) {
    throw error(400, {
      message: 'Sistema no especificado. El parámetro "system" es requerido en la URL.'
    });
  }

  // Resolver la configuración del brand
  const brandConfig = resolveBrand(systemParam);

  // Si no existe la configuración, retornar error
  if (!brandConfig) {
    throw error(404, {
      message: `Sistema "${systemParam}" no encontrado o no configurado. Verifica el enlace con tu administrador.`
    });
  }

  // Retornar los datos al cliente
  return {
    system: systemParam,
    brandConfig: brandConfig as BrandConfig
  };
};
