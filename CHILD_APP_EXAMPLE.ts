/**
 * EJEMPLO DE IMPLEMENTACIÓN EN APLICACIÓN HIJA
 * 
 * Este archivo muestra cómo manejar el callback de autenticación
 * en las aplicaciones hijas (InterPOS, Admin, Tienda, etc.)
 * 
 * IMPORTANTE: Este es solo un ejemplo de referencia.
 * Cada aplicación hija debe implementar su propia lógica.
 */

// ============================================
// OPCIÓN 1: SvelteKit con Server Load
// ============================================

// Archivo: src/routes/auth/callback/+page.server.ts

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  // Obtener el código de autorización de la URL
  const code = url.searchParams.get('code');
  
  if (code) {
    // Intercambiar el código por una sesión
    const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error al intercambiar código:', error);
      throw redirect(303, '/auth/error');
    }
    
    // Verificar la sesión
    const { data: { session } } = await locals.supabase.auth.getSession();
    
    if (session) {
      // Sesión válida - redirigir al dashboard
      throw redirect(303, '/dashboard');
    }
  }
  
  // Si no hay código o la sesión falló
  throw redirect(303, '/auth/login');
};

// ============================================
// OPCIÓN 2: React/Next.js
// ============================================

/*
// Archivo: pages/auth/callback.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  
  useEffect(() => {
    const handleCallback = async () => {
      const { code } = router.query;
      
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code as string);
        
        if (error) {
          console.error('Error:', error);
          router.push('/auth/error');
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          router.push('/dashboard');
        } else {
          router.push('/auth/login');
        }
      }
    };
    
    handleCallback();
  }, [router]);
  
  return <div>Autenticando...</div>;
}
*/

// ============================================
// OPCIÓN 3: Vue.js/Nuxt
// ============================================

/*
// Archivo: pages/auth/callback.vue

<template>
  <div>Autenticando...</div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';

const router = useRouter();

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error:', error);
      router.push('/auth/error');
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }
});
</script>
*/

// ============================================
// CLIENTE DE SUPABASE EN LA APLICACIÓN HIJA
// ============================================

/*
// Archivo: src/lib/supabaseClient.ts (o similar)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
*/

// ============================================
// PROTECCIÓN DE RUTAS
// ============================================

/*
// Ejemplo de middleware para proteger rutas

export async function requireAuth(request) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Redirigir al intermediario de autenticación
    const authUrl = `https://auth.midominio.com/?system=interpos`;
    return Response.redirect(authUrl);
  }
  
  return session;
}
*/

// ============================================
// OBTENER INFORMACIÓN DEL USUARIO
// ============================================

/*
// Obtener el usuario actual

const { data: { user }, error } = await supabase.auth.getUser();

if (user) {
  console.log('Usuario:', user.email);
  console.log('ID:', user.id);
  console.log('Metadata:', user.user_metadata);
}
*/

// ============================================
// CERRAR SESIÓN
// ============================================

/*
// Cerrar sesión

async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  
  if (!error) {
    // Redirigir al login
    window.location.href = 'https://auth.midominio.com/?system=interpos';
  }
}
*/

export {};
