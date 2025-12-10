/**
 * Supabase Client
 *
 * Cliente de Supabase configurado con las credenciales del entorno.
 * Este cliente se usa en toda la aplicación para autenticación.
 *
 * Configuración requerida:
 * - PUBLIC_SUPABASE_URL: URL de tu instancia de Supabase (para cliente)
 * - PUBLIC_SUPABASE_ANON_KEY: Clave anónima de Supabase (para cliente)
 * - SUPABASE_URL: URL de tu instancia de Supabase (para servidor)
 * - SUPABASE_ANON_KEY: Clave anónima de Supabase (para servidor)
 */

import { createClient } from "@supabase/supabase-js";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    "⚠️ Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY in supabaseClient.ts. Using placeholders to prevent build failure."
  );
}

/**
 * Cliente de Supabase para toda la aplicación
 * Usa este cliente para todas las operaciones de autenticación
 */
export const supabase = createClient(
  PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  PUBLIC_SUPABASE_ANON_KEY || "placeholder",
  {
    auth: {
      // Configuración de persistencia de sesión
      persistSession: true,
      autoRefreshToken: true,
      // We disable automatic URL fragment/session detection to let the
      // dedicated `/auth/callback` page call `getSessionFromUrl` explicitly.
      detectSessionInUrl: false,
    },
  }
);
