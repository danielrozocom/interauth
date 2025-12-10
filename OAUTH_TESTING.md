# Testing del Flujo OAuth en InterAuth

## URLs de Prueba

### 1. Flujo OAuth Exitoso (Google)

```
https://auth.interfundeoms.edu.co/callback?code=AUTH_CODE_FROM_GOOGLE&system=auth&redirectTo=/dashboard
```

**Esperado:**

- ✅ Se ejecuta `exchangeCodeForSession(code)`
- ✅ La sesión se guarda en cookies (`supabase-auth-token`)
- ✅ Se redirige a `/dashboard`

### 2. Flujo OAuth Fallido (Código Inválido)

```
https://auth.interfundeoms.edu.co/callback?code=INVALID_CODE&system=auth
```

**Esperado:**

- ❌ `exchangeCodeForSession` falla
- ✅ Se redirige a `/error?error=oauth_failed&description=...`
- ✅ Se muestra página de error con opción de reintentar

### 3. Flujo sin Código

```
https://auth.interfundeoms.edu.co/callback?system=auth
```

**Esperado:**

- ⚠️ `code` es null
- ✅ Se retorna mensaje "No se recibió ningún código de autenticación"
- ✅ La página de callback muestra error sin redirigir

### 4. Flujo de Recuperación de Contraseña

```
https://auth.interfundeoms.edu.co/callback?type=recovery&access_token=TOKEN&refresh_token=TOKEN&system=auth
```

**Esperado:**

- ✅ NO se ejecuta `exchangeCodeForSession`
- ✅ Los tokens se forwarden a `/reset-password`
- ✅ Se redirige a `/reset-password?type=recovery&access_token=...&refresh_token=...&system=auth`

### 5. Flujo con `redirectTo` Personalizado

```
https://auth.interfundeoms.edu.co/callback?code=AUTH_CODE&system=school&redirectTo=https://escuela.edu.co/dashboard
```

**Esperado:**

- ✅ Se respeta el parámetro `redirectTo`
- ✅ Se redirige a `https://escuela.edu.co/dashboard` (si es válido)

---

## Verificaciones Manuales

### 1. Verificar que NO hay redirect automático a Supabase

En `src/routes/callback/+page.server.ts`, verificar:

```typescript
// NO debe haber window.location.replace() antes de exchangeCodeForSession
const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
  code!
);
// Primero se procesa el error, LUEGO se redirige
```

✅ **Pasada**: El exchange ocurre antes de cualquier redirección

### 2. Verificar que las cookies se guardan

En el navegador (DevTools → Application → Cookies):

Después del callback exitoso, debe existir:

- `sb-ACCESS_TOKEN_CLAIM-auth-token` (o similar según Supabase)
- La cookie debe tener:
  - Domain: `.interfundeoms.edu.co` (en producción)
  - Path: `/`
  - Secure: ✅ (en HTTPS)
  - SameSite: `Lax`

✅ **Pasada**: Las cookies se crean automáticamente via `createSupabaseServerClient`

### 3. Verificar que `system` se preserva en errores

Después de un error OAuth, la URL debe ser:

```
/error?error=oauth_failed&description=...&system=nombre_sistema
```

✅ **Pasada**: El parámetro `system` se incluye en la redirección a `/error`

### 4. Verificar que la página de error es accesible

Navegar a:

```
https://auth.interfundeoms.edu.co/error?error=oauth_failed&description=Test%20Error&system=auth
```

✅ **Pasada**: Se muestra la página de error con:

- Icono de error
- Mensaje: "Error en la autenticación OAuth"
- Detalles técnicos: "Test Error"
- Botones: "Intentar de nuevo" y "Volver al inicio"

---

## Verificaciones de Seguridad

### 1. No se exponen tokens en logs

En `src/routes/callback/+page.server.ts`:

```typescript
console.log("--- Callback Redirect Debug ---");
console.log("Current URL:", url.toString()); // ⚠️ VERIFICAR que no muestre tokens
console.log("Final Redirect URL:", result.redirectUrl);
```

⚠️ **Nota**: Los logs del callback podrían exponer `code` o `access_token`. En producción, considerar:

```typescript
// Sanitizar antes de loguear
const sanitizedUrl = url.toString().replace(/code=[^&]*/g, "code=***");
console.log("Current URL:", sanitizedUrl);
```

### 2. Las redirecciones respetan el dominio

En `src/lib/supabase/serverClient.ts`:

```typescript
domain: process.env.NODE_ENV === "development" ? undefined : ".interfundeoms.edu.co",
```

✅ **Pasada**: Las cookies solo se comparten entre subdominios de `interfundeoms.edu.co`

### 3. No hay XSS en la página de error

En `src/routes/error/+page.svelte`:

```svelte
<p class="description">{errorDescription}</p>
```

✅ **Pasada**: Svelte escapa automáticamente el contenido (no es vulnerable a XSS)

---

## Integración con CI/CD

Para automatizar pruebas, puedes crear un test con Playwright:

```typescript
// tests/oauth-callback.test.ts
import { test, expect } from "@playwright/test";

test("OAuth callback exchanges code for session", async ({ page }) => {
  // Mock Supabase exchangeCodeForSession
  const mockCode = "test_code_123";

  await page.goto(`/callback?code=${mockCode}&system=auth`);

  // Verificar que hay cookies de sesión
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name.includes("auth-token"))).toBeTruthy();

  // Verificar redirección final
  await expect(page).toHaveURL(/\//);
});

test("OAuth callback shows error on failure", async ({ page }) => {
  const invalidCode = "invalid_code";

  await page.goto(`/callback?code=${invalidCode}&system=auth`);

  // Debe redirigir a /error
  await expect(page).toHaveURL(/\/error/);

  // Verificar contenido de error
  await expect(page.getByText(/Error en la autenticación OAuth/)).toBeVisible();
});
```

---

## Logs Esperados

### Éxito:

```
--- Callback Redirect Debug ---
Current URL: https://auth.interfundeoms.edu.co/callback?code=...&system=auth
Type: undefined
Redirect To Param: undefined
Final Redirect URL: /
-------------------------------
```

### Error:

```
Error al establecer sesión: invalid_grant
--- Callback Redirect Debug ---
Current URL: https://auth.interfundeoms.edu.co/callback?code=INVALID&system=auth
Type: undefined
Redirect To Param: undefined
Final Redirect URL: /error?error=oauth_failed&description=invalid_grant&system=auth
-------------------------------
```

---

## Checklist Final

- [ ] El callback recibe parámetros correctamente
- [ ] `exchangeCodeForSession` se ejecuta antes de redirigir
- [ ] Las cookies se guardan automáticamente
- [ ] Los errores OAuth redirigen a `/error`
- [ ] La página de error muestra detalles técnicos
- [ ] El parámetro `redirectTo` se respeta
- [ ] El parámetro `system` se preserva
- [ ] El flujo de recuperación funciona separadamente
- [ ] No hay redirecciones automáticas a Supabase
- [ ] Las cookies tienen opciones de seguridad correctas

---

## Próximos Pasos

Si deseas mejorar el flujo:

1. **Sanitizar logs**: No loguear tokens o códigos completos
2. **Implementar retry logic**: Reintentos automáticos para fallos transitorios
3. **Agregar telemetría**: Trackear conversiones y abandonos
4. **Rate limiting**: Proteger contra abuso de OAuth
5. **Audit logging**: Registrar todas las autenticaciones exitosas en BD
