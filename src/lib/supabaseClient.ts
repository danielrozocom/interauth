/**
 * Supabase Client
 *
 * Cliente de Supabase configurado con las credenciales del entorno.
 * Este cliente se usa en toda la aplicación para autenticación.
 *
 * Configuración requerida:
 * - VITE_SUPABASE_URL: URL de tu instancia de Supabase
 * - VITE_SUPABASE_ANON_KEY: Clave anónima de Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { browser } from "$app/environment";
// Obtener variables de entorno: en cliente usamos `VITE_` y en servidor `process.env`
const supabaseUrl = browser
  ? import.meta.env.VITE_SUPABASE_URL
  : process.env.SUPABASE_URL;
const supabaseAnonKey = browser
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // En servidor es crítico: lanzar un error claro para facilitar debugging en logs
  if (!browser) {
    console.error(
      "Supabase environment variables missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set."
    );
  } else {
    console.error(
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set for the client."
    );
  }
}

/**
 * Cliente de Supabase para toda la aplicación
 * Usa este cliente para todas las operaciones de autenticación
 */
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    // Configuración de persistencia de sesión
    persistSession: true,
    autoRefreshToken: true,
    // We disable automatic URL fragment/session detection to let the
    // dedicated `/auth/callback` page call `getSessionFromUrl` explicitly.
    detectSessionInUrl: false,
  },
});
