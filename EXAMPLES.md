# 🎨 Ejemplos de Uso - InterAuth

Esta guía contiene ejemplos prácticos de cómo usar InterAuth en diferentes escenarios.

---

## 📝 Tabla de Contenidos

1. [Uso Básico](#uso-básico)
2. [Personalización de Sistemas](#personalización-de-sistemas)
3. [Integración con Apps Hijas](#integración-con-apps-hijas)
4. [Manejo de Sesiones](#manejo-de-sesiones)
5. [Redirección Personalizada](#redirección-personalizada)
6. [Ejemplos de Errores](#ejemplos-de-errores)

---

## 🚀 Uso Básico

### Login Simple

Usuario abre el navegador en:
```
https://auth.midominio.com/?system=interpos
```

**Flujo**:
1. Se carga la página con branding de InterPOS
2. Usuario ve botón "Continuar con Google" (azul #35528C)
3. Click en el botón
4. Redirige a Google para autenticación
5. Google redirige a: `https://interpos.midominio.com/auth/callback`
6. App hija maneja el callback y crea sesión
7. Usuario está logueado ✅

---

## 🎨 Personalización de Sistemas

### Ejemplo 1: Agregar Nuevo Sistema "Ventas"

**Paso 1**: Edita `src/lib/brandConfig.ts`

```typescript
const BRAND_CONFIG: Record<string, BrandConfig> = {
  // Sistemas existentes...
  interpos: { ... },
  admin: { ... },
  tienda: { ... },
  
  // ✨ Nuevo sistema
  ventas: {
    name: 'Sistema de Ventas',
    primaryColor: '#10B981',  // Verde
    redirectUrlAfterLogin: 'https://ventas.midominio.com/auth/callback'
  }
};
```

**Paso 2**: Configura Supabase

Agrega a `GOTRUE_URI_ALLOW_LIST`:
```
https://ventas.midominio.com/auth/callback
```

**Paso 3**: Usa el nuevo sistema

```
https://auth.midominio.com/?system=ventas
```

### Ejemplo 2: Cambiar Color de Sistema Existente

```typescript
// Antes
interpos: {
  name: 'InterPOS',
  primaryColor: '#35528C',  // Azul oscuro
  redirectUrlAfterLogin: 'https://interpos.midominio.com/auth/callback'
}

// Después
interpos: {
  name: 'InterPOS',
  primaryColor: '#3B82F6',  // Azul brillante ✨
  redirectUrlAfterLogin: 'https://interpos.midominio.com/auth/callback'
}
```

### Ejemplo 3: Múltiples Ambientes

```typescript
// Desarrollo
const DEV_CONFIG = {
  interpos: {
    name: 'InterPOS (Dev)',
    primaryColor: '#35528C',
    redirectUrlAfterLogin: 'http://localhost:3000/auth/callback'
  }
};

// Producción
const PROD_CONFIG = {
  interpos: {
    name: 'InterPOS',
    primaryColor: '#35528C',
    redirectUrlAfterLogin: 'https://interpos.midominio.com/auth/callback'
  }
};

// Usar según entorno
const BRAND_CONFIG = import.meta.env.MODE === 'production' 
  ? PROD_CONFIG 
  : DEV_CONFIG;
```

---

## 🔗 Integración con Apps Hijas

### Ejemplo 1: SvelteKit App Hija

#### Estructura de la App Hija
```
mi-app/
├── src/
│   ├── routes/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── +page.server.ts  👈 Maneja el callback
│   │   ├── dashboard/
│   │   │   └── +page.svelte
│   │   └── +layout.server.ts
│   └── lib/
│       └── supabaseClient.ts
```

#### Implementación del Callback

**Archivo**: `src/routes/auth/callback/+page.server.ts`

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  // Obtener el código de autorización
  const code = url.searchParams.get('code');
  
  if (code) {
    // Intercambiar código por sesión
    const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth error:', error);
      throw redirect(303, '/error?message=auth_failed');
    }
    
    // Verificar sesión
    const { data: { session } } = await locals.supabase.auth.getSession();
    
    if (session) {
      // Éxito - redirigir al dashboard
      throw redirect(303, '/dashboard');
    }
  }
  
  // Falló - volver al login
  throw redirect(303, 'https://auth.midominio.com/?system=interpos');
};
```

#### Layout con Protección de Rutas

**Archivo**: `src/routes/+layout.server.ts`

```typescript
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Obtener sesión
  const { data: { session } } = await locals.supabase.auth.getSession();
  
  // Rutas públicas (no requieren auth)
  const publicRoutes = ['/auth/callback', '/error'];
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));
  
  // Si no hay sesión y no es ruta pública, redirigir a auth
  if (!session && !isPublicRoute) {
    throw redirect(303, 'https://auth.midominio.com/?system=interpos');
  }
  
  return {
    session,
    user: session?.user
  };
};
```

### Ejemplo 2: React/Next.js App Hija

#### Página de Callback

**Archivo**: `pages/auth/callback.tsx`

```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  
  useEffect(() => {
    const handleCallback = async () => {
      // Obtener código de la URL
      const { code } = router.query;
      
      if (code && typeof code === 'string') {
        // Intercambiar código por sesión
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Auth error:', error);
          router.push('/error?message=auth_failed');
          return;
        }
        
        // Verificar sesión
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Éxito - redirigir al dashboard
          router.push('/dashboard');
        } else {
          // Falló - volver al login
          window.location.href = 'https://auth.midominio.com/?system=admin';
        }
      }
    };
    
    if (router.isReady) {
      handleCallback();
    }
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Autenticando...</p>
      </div>
    </div>
  );
}
```

#### HOC de Protección

**Archivo**: `lib/withAuth.tsx`

```typescript
import { useEffect, ComponentType } from 'react';
import { useRouter } from 'next/router';
import { supabase } from './supabaseClient';

export function withAuth<P extends object>(Component: ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    
    useEffect(() => {
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          window.location.href = 'https://auth.midominio.com/?system=admin';
        }
      };
      
      checkAuth();
    }, []);
    
    return <Component {...props} />;
  };
}

// Uso:
// export default withAuth(MyProtectedPage);
```

---

## 🔐 Manejo de Sesiones

### Obtener Usuario Actual

```typescript
// En cualquier componente o página
const { data: { user }, error } = await supabase.auth.getUser();

if (user) {
  console.log('Email:', user.email);
  console.log('ID:', user.id);
  console.log('Nombre:', user.user_metadata.full_name);
  console.log('Avatar:', user.user_metadata.avatar_url);
}
```

### Verificar Sesión Activa

```typescript
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  console.log('Sesión activa');
  console.log('Expira en:', session.expires_at);
  console.log('Token:', session.access_token);
} else {
  console.log('No hay sesión activa');
}
```

### Cerrar Sesión

```typescript
async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  
  if (!error) {
    // Redirigir al login
    window.location.href = 'https://auth.midominio.com/?system=interpos';
  }
}
```

### Escuchar Cambios de Sesión

```typescript
// En el layout o componente raíz
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  
  if (event === 'SIGNED_IN') {
    console.log('Usuario logueado:', session?.user);
  }
  
  if (event === 'SIGNED_OUT') {
    console.log('Usuario deslogueado');
    window.location.href = 'https://auth.midominio.com/?system=interpos';
  }
  
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token renovado');
  }
});
```

---

## 🎯 Redirección Personalizada

### Ejemplo 1: Redirigir a Página Específica

Modifica la URL de callback para incluir un parámetro:

```typescript
// En InterAuth (+page.svelte)
const redirectUrl = `${data.brandConfig.redirectUrlAfterLogin}?returnTo=/mi-pagina`;
```

En la app hija:

```typescript
// En callback
export const load: PageServerLoad = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  const returnTo = url.searchParams.get('returnTo') || '/dashboard';
  
  if (code) {
    await locals.supabase.auth.exchangeCodeForSession(code);
    throw redirect(303, returnTo);  // Redirige a la página solicitada
  }
};
```

### Ejemplo 2: Guardar Estado Antes de Login

```typescript
// Antes de redirigir al auth, guarda el estado
localStorage.setItem('auth_return_url', window.location.pathname);

// Redirigir
window.location.href = 'https://auth.midominio.com/?system=interpos';

// Después del callback, restaurar
const returnUrl = localStorage.getItem('auth_return_url') || '/dashboard';
localStorage.removeItem('auth_return_url');
router.push(returnUrl);
```

---

## ❌ Ejemplos de Errores

### Error 1: Sistema No Encontrado

**URL**: `https://auth.midominio.com/?system=invalido`

**Respuesta**:
```
Status: 404
Mensaje: Sistema "invalido" no encontrado o no configurado
```

**Solución**:
- Verifica que el sistema exista en `brandConfig.ts`
- Verifica que el parámetro sea correcto (case-insensitive)

### Error 2: Parámetro System Faltante

**URL**: `https://auth.midominio.com/`

**Respuesta**:
```
Status: 400
Mensaje: Sistema no especificado. El parámetro "system" es requerido
```

**Solución**:
- Agrega `?system=NOMBRE` a la URL

### Error 3: Redirect URL No Permitida

**Logs de Supabase**:
```
Error: redirect_uri_mismatch
The redirect URI provided does not match
```

**Solución**:
- Agrega la URL a `GOTRUE_URI_ALLOW_LIST` en Supabase
- Verifica que no haya espacios extra

### Error 4: Google OAuth No Configurado

**Console**:
```
Error: Provider 'google' is not enabled
```

**Solución**:
- Habilita Google OAuth en Supabase Dashboard
- Verifica `GOTRUE_EXTERNAL_GOOGLE_ENABLED=true`
- Verifica Client ID y Secret

---

## 🧪 Testing de Integración

### Test Completo del Flujo

```typescript
// Pseudo-código para test E2E

test('Login flow completo', async () => {
  // 1. Ir a la app hija sin sesión
  await page.goto('https://miapp.com/dashboard');
  
  // 2. Debe redirigir a auth
  expect(page.url()).toContain('auth.midominio.com');
  expect(page.url()).toContain('?system=');
  
  // 3. Click en "Continuar con Google"
  await page.click('button');
  
  // 4. Debe redirigir a Google
  expect(page.url()).toContain('accounts.google.com');
  
  // 5. Login en Google (simulado)
  // ...
  
  // 6. Debe redirigir al callback
  expect(page.url()).toContain('/auth/callback');
  
  // 7. Debe redirigir al dashboard
  await page.waitForNavigation();
  expect(page.url()).toContain('/dashboard');
  
  // 8. Usuario debe estar logueado
  const user = await page.evaluate(() => {
    return supabase.auth.getUser();
  });
  expect(user).toBeDefined();
});
```

---

## 📦 Resumen de URLs

| Sistema | Auth URL | Callback URL |
|---------|----------|--------------|
| **InterPOS** | `?system=interpos` | `https://interpos.midominio.com/auth/callback` |
| **Admin** | `?system=admin` | `https://admin.midominio.com/auth/callback` |
| **Tienda** | `?system=tienda` | `https://tienda.midominio.com/auth/callback` |

---

## 💡 Mejores Prácticas

1. ✅ Siempre valida la sesión en el servidor (no solo cliente)
2. ✅ Usa HTTPS en producción
3. ✅ Implementa timeout de sesión
4. ✅ Maneja errores de red gracefully
5. ✅ Guarda logs de autenticación para debugging
6. ✅ Usa el mismo cliente de Supabase en toda la app
7. ✅ Renueva tokens automáticamente (Supabase lo hace)
8. ✅ Cierra sesión en todas las pestañas (broadcast channel)

---

## 🎓 Recursos Adicionales

- 📖 **CHILD_APP_EXAMPLE.ts** - Más ejemplos de integración
- 🔧 **DEVELOPMENT.md** - Guía de desarrollo
- 🔒 **SUPABASE_CONFIG.md** - Configuración detallada
- ✅ **TESTING.md** - Guía de testing

---

**¿Necesitas más ejemplos?** Abre un issue o contacta al equipo. 🚀
