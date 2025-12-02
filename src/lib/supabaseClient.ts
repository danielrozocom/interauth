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

import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  if (browser) {
    console.error(
      'Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar configurados en .env'
    );
  }
}

/**
 * Cliente de Supabase para toda la aplicación
 * Usa este cliente para todas las operaciones de autenticación
 */
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    // Configuración de persistencia de sesión
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
