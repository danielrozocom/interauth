# Implementación del Flujo OAuth en el Callback de InterAuth

## Resumen de Cambios

Se han añadido las mejoras mínimas y esenciales al flujo de OAuth (Google) en la ruta `/callback` usando Supabase Self-Hosted. **No se reescribió código existente**, solo se añadió lo necesario.

---

## 1. Detección de Parámetros

El callback detecta correctamente los parámetros clave:

```typescript
const code = url.searchParams.get("code"); // Código OAuth
const redirectTo = url.searchParams.get("redirectTo"); // URL destino
const system = url.searchParams.get("system"); // Sistema/Brand
const type = url.searchParams.get("type"); // recovery, signup, etc.
```

---

## 2. Ejecución del Exchange de Código

**Ubicación**: `src/routes/callback/+page.server.ts`, líneas 47-62

Se ejecuta el exchange de código **ANTES de cualquier redirección**:

```typescript
if (type !== "recovery") {
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code!
  );
  error = exchangeError;

  if (error) {
    // Manejar error → redirección a /error
    const errorParams = new URLSearchParams();
    errorParams.set("error", "oauth_failed");
    errorParams.set("description", error.message || "OAuth exchange failed");
    if (system) errorParams.set("system", system);
    result.redirectUrl = "/error?" + errorParams.toString();
    return result;
  }

  // Verificar sesión fue creada
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    result.message =
      "No se pudo establecer la sesión. Intenta iniciar sesión manualmente.";
    return result;
  }
}
```

**Garantías:**

- ✅ No hay auto-redirect antes de completar el exchange
- ✅ La sesión se verifica después del exchange
- ✅ Las cookies se guardan automáticamente (via `createSupabaseServerClient`)

---

## 3. Manejo de Errores OAuth

**Nuevo**: Se redirige a `/error` con información del fallo:

```typescript
// Ruta: /error?error=oauth_failed&description=...&system=...
```

**Nueva página de error**: `src/routes/error/+page.svelte`

La página muestra:

- Mensaje de error amigable
- Detalles técnicos (para debugging)
- Opción de "Intentar de nuevo"
- Botón "Volver al inicio"

---

## 4. Lógica de Redirección

Después de completar el exchange exitosamente:

```typescript
if (type === "recovery") {
  // → /reset-password con tokens
  result.redirectUrl =
    "/reset-password?type=recovery&access_token=...&refresh_token=...";
} else if (redirectTo) {
  // → URL solicitada explícitamente
  result.redirectUrl = redirectTo;
} else {
  // → Configuración del brand o DEFAULT_REDIRECT_URL
  const brandConfig = resolveBrand(system);
  result.redirectUrl =
    brandConfig?.redirectUrlAfterLogin || DEFAULT_REDIRECT_URL;
}
```

**Garantías:**

- ✅ El callback **NO redirige directamente a Supabase**
- ✅ Todo se controla desde InterAuth
- ✅ Se respetan los parámetros `redirectTo` y `system`

---

## 5. Gestión de Cookies de Sesión

**Helper existente**: `src/lib/supabase/serverClient.ts`

El cliente Supabase se crea con un manejador de cookies integrado:

```typescript
return createServerClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    get: (key) => cookies.get(key),
    set: (key, value, options) => {
      cookies.set(key, value, {
        ...options,
        path: "/",
        domain:
          process.env.NODE_ENV === "development"
            ? undefined
            : ".interfundeoms.edu.co",
        sameSite: "lax",
        secure: process.env.NODE_ENV !== "development",
      });
    },
    remove: (key, options) => {
      /* ... */
    },
  },
});
```

**Resultado**: Las sesiones se guardan automáticamente en cookies sin código adicional.

---

## 6. Arquitectura del Flujo OAuth

```
┌─────────────────────────────────────────┐
│ Google OAuth Provider                   │
└──────────────┬──────────────────────────┘
               │
               └──> /callback?code=...&system=...&redirectTo=...
                    │
                    ├─ Detectar parámetros
                    ├─ EJECUTAR exchangeCodeForSession(code)
                    │
                    ├─ ¿Error en exchange?
                    │  └─> /error?error=oauth_failed&description=...
                    │
                    ├─ ¿Sesión válida?
                    │  └─> Cookies guardadas automáticamente
                    │
                    └─ Redireccionar según:
                       ├─ type=recovery → /reset-password
                       ├─ redirectTo → Use specified URL
                       └─ default → Brand config or /
```

---

## 7. Archivos Modificados

### Modificados:

- **`src/routes/callback/+page.server.ts`**
  - Mejorado manejo de errores OAuth
  - Comentario clarificador: "NO REDIRIGIR ANTES DE COMPLETAR EL EXCHANGE"

### Creados:

- **`src/routes/error/+page.svelte`** (NUEVO)
  - Página para mostrar errores OAuth
  - Acepta parámetros: `error`, `description`, `system`

---

## 8. Flujo de Prueba

Para probar el flujo OAuth:

1. **Configurar Google OAuth en Supabase**:

   - OAuth Redirect URI debe ser: `https://tu-dominio.com/callback`

2. **Iniciar flujo de login**:

   ```
   https://auth.interfundeoms.edu.co/?system=nombre_sistema
   ```

3. **Verificar redirecciones**:

   - ✅ Éxito: Redirige a `redirectTo` o configuración del brand
   - ❌ Fallo: Redirige a `/error?error=oauth_failed&description=...`

4. **Verificar sesión**:
   - Las cookies de sesión debe estar presentes
   - `supabase-auth-token` debe contener el JWT

---

## 9. Verificaciones de Seguridad

✅ **No hay redirects automáticos antes de completar el exchange**
✅ **Las cookies se guardan con opciones seguras** (sameSite, secure, domain)
✅ **Los errores se manejan sin exponer tokens**
✅ **El sistema de brands se respeta** (resolución dinámica)
✅ **Los helpers existentes se mantienen intactos**

---

## 10. Próximos Pasos (Si es necesario)

Si necesitas más refinamientos:

1. **Logging de errores**: Añadir a Sentry o similar
2. **Rate limiting**: Proteger contra ataques de fuerza bruta
3. **Refresh token rotation**: Implementar rotación segura
4. **User audit**: Registrar eventos de autenticación en BD

---

## Notas

- Este flujo es compatible con **Supabase Self-Hosted**
- La configuración se lee de variables de entorno (via `$env/dynamic/private`)
- No requiere cambios en cliente Svelte ni en la configuración existente
- El flujo de **recuperación de contraseña** se mantiene separado e intacto
