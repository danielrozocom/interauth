# 🚀 Quick Reference: OAuth Callback Flow

## Cambio Principal

**Antes**: El callback podría redirigir sin completar `exchangeCodeForSession`

**Ahora**: Garantiza que se ejecute `exchangeCodeForSession` ANTES de cualquier redirección

---

## Flujo OAuth Paso a Paso

```
1️⃣  GET /callback?code=AUTH_CODE&system=...&redirectTo=...
    └─ Parámetros detectados en las líneas 3-15

2️⃣  Validar que existe 'code' (línea 39)
    ├─ Si no existe → Error "No code received" → Mostrar en página

3️⃣  ✨ EJECUTAR exchangeCodeForSession(code)  (línea 51)
    │  await supabase.auth.exchangeCodeForSession(code!)
    │
    ├─ ¿Error en el exchange?
    │  └─ Líneas 52-61: Redirigir a /error?error=oauth_failed&description=...
    │
    └─ ¿Éxito?
       └─ Línea 64: Verificar que la sesión existe

4️⃣  Guardar sesión en cookies (AUTOMÁTICO)
    └─ Via createSupabaseServerClient (src/lib/supabase/serverClient.ts)

5️⃣  Determinar URL de destino
    ├─ Si type=recovery? → /reset-password (líneas 82-94)
    ├─ Si redirectTo? → Usar redirectTo (línea 97)
    └─ Si nada? → Config del brand o / (líneas 99-104)

6️⃣  Retornar resultado con redirectUrl (línea 111)
    └─ Frontend (.svelte) redirige via setTimeout + window.location.replace()
```

---

## Puntos Clave

| Aspecto                 | Dónde                    | Qué Hace                                            |
| ----------------------- | ------------------------ | --------------------------------------------------- |
| **Detectar parámetros** | `+page.server.ts:3-15`   | Extrae `code`, `redirectTo`, `system`, `type`       |
| **Validar code**        | `+page.server.ts:39`     | Si no hay code, retorna error temprano              |
| **Exchange code**       | `+page.server.ts:51`     | `await supabase.auth.exchangeCodeForSession(code!)` |
| **Manejo de error**     | `+page.server.ts:52-61`  | Si error, redirige a `/error`                       |
| **Verificar sesión**    | `+page.server.ts:64`     | Asegura que la sesión fue creada                    |
| **Guardar cookies**     | `hooks.server.ts:47`     | Cliente Supabase maneja automáticamente             |
| **Redireccionar**       | `+page.server.ts:82-104` | Según type, redirectTo, o config                    |

---

## Archivos Modificados vs Creados

### ✏️ Modificado (1 archivo)

```typescript
// src/routes/callback/+page.server.ts
// Línea 24: Comentario aclaratorio
// Líneas 52-61: Mejorado manejo de errores OAuth
```

**Cambio**: Solo se mejoró el bloque de error, nada más se modificó.

### ✨ Creado (3 archivos)

```
src/routes/error/+page.svelte      ← Nueva página de error OAuth
OAUTH_IMPLEMENTATION.md             ← Documentación técnica
OAUTH_TESTING.md                    ← Guía de testing
OAUTH_SUMMARY.md                    ← Este archivo
```

---

## Parámetros de URL Soportados

| Parámetro       | Tipo   | Ejemplo           | Efecto                    |
| --------------- | ------ | ----------------- | ------------------------- |
| `code`          | string | `code=ABC123`     | ✅ Obligatorio para OAuth |
| `redirectTo`    | string | `redirectTo=/app` | Destino después del login |
| `system`        | string | `system=school`   | Resuelve brand config     |
| `type`          | string | `type=recovery`   | Flujo de recuperación     |
| `access_token`  | string | Para recovery     | Tokens de recuperación    |
| `refresh_token` | string | Para recovery     | Tokens de recuperación    |

---

## Rutas Relacionadas

```
/callback           ← Maneja OAuth exchange (este archivo)
/error              ← Muestra errores OAuth
/reset-password     ← Flujo de recuperación de contraseña
/                   ← Home/Dashboard
```

---

## Ejemplos de URLs Reales

### ✅ Exitoso

```
https://auth.interfundeoms.edu.co/callback?code=ABC123&system=auth
→ Redirige a / (o redirectTo)
```

### ❌ Error

```
https://auth.interfundeoms.edu.co/callback?code=INVALID&system=auth
→ Redirige a /error?error=oauth_failed&description=invalid_grant&system=auth
```

### 🔑 Recovery

```
https://auth.interfundeoms.edu.co/callback?type=recovery&access_token=X&refresh_token=Y
→ Redirige a /reset-password?type=recovery&access_token=X&refresh_token=Y
```

---

## Logs Importantes

### Éxito

```
[stdout] --- Callback Redirect Debug ---
[stdout] Current URL: https://auth.interfundeoms.edu.co/callback?code=...
[stdout] Final Redirect URL: /
```

### Fallo

```
[warn] Error al establecer sesión: invalid_grant
[stdout] --- Callback Redirect Debug ---
[stdout] Final Redirect URL: /error?error=oauth_failed&description=invalid_grant
```

---

## Verificación Rápida (DevTools)

### 1. Cookies después del login

```javascript
// En la consola del navegador
document.cookie;
// Deberías ver: sb-*-auth-token=...
```

### 2. Estado de redirección

```javascript
// Verificar que redirectUrl está en el servidor
// Ver en Network tab la respuesta del callback
// response: { connected: true, redirectUrl: "/" }
```

### 3. Parámetros recibidos

```
En +page.server.ts está el console.log:
--- Callback Redirect Debug ---
Current URL: ...
Redirect To Param: ...
Final Redirect URL: ...
```

---

## Posibles Errores y Soluciones

| Error                | Causa                                  | Solución                         |
| -------------------- | -------------------------------------- | -------------------------------- |
| `invalid_grant`      | Código expirado/inválido               | Reintentar login                 |
| `No code received`   | URL sin ?code                          | Verificar redirect URI en Google |
| `No session created` | Exchange exitoso pero sin sesión       | Verificar config de Supabase     |
| `No redirect`        | Código devuelve error pero no redirige | Verificar /error existe          |

---

## Integración con Google OAuth

### En Google Console:

```
Authorized redirect URIs:
└─ https://auth.interfundeoms.edu.co/callback
```

### En Supabase:

```
Auth → Providers → Google
└─ Client ID y Client Secret configurados
```

### En InterAuth:

```
SUPABASE_URL=https://...
PUBLIC_SUPABASE_ANON_KEY=...
```

---

## ¿Qué NO Se Modificó?

✅ `src/lib/supabaseClient.ts` - Cliente no cambiado
✅ `src/hooks.server.ts` - Hooks intactos  
✅ `src/routes/+layout.server.ts` - Layout sin cambios
✅ `src/lib/supabase/serverClient.ts` - Helpers sin cambios
✅ `src/routes/callback/+page.svelte` - Frontend sin cambios

Solo se mejoró `+page.server.ts` con mejor manejo de errores.

---

## Próxima Lectura Recomendada

1. **Entender el flujo**: Lee `OAUTH_IMPLEMENTATION.md`
2. **Probar**: Lee `OAUTH_TESTING.md`
3. **Seguridad**: Busca "Verificaciones de Seguridad" en ambos docs
4. **Debug**: Usa los logs del callback en console

---

## Contacto y Soporte

Si hay problemas:

1. Revisa los logs: `console.log` en `+page.server.ts`
2. Verifica cookies en DevTools
3. Asegúrate que Google OAuth está configurado
4. Comprueba que SUPABASE_URL y ANON_KEY están seteadas

**El flujo ahora es robusto y seguro.** ✨
