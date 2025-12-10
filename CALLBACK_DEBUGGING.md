# 🔍 Debugging del Callback - Verificación de Redirección

Si la sesión se crea pero no redirige, sigue estos pasos:

## 1️⃣ Abre DevTools (F12)

- Ve a la pestaña **Console**
- Observa los logs mientras estás en `/callback`

Deberías ver algo como:

```
📥 Datos recibidos en callback/+page.svelte: {
  connected: true,
  redirectUrl: "/dashboard",
  message: "Verificado correctamente...",
  isRecovery: false
}
✅ Redirección válida detectada
🔄 Redirigiendo a: /dashboard
```

## 2️⃣ Si NO ves la redirección

### Caso 1: `connected=false`

```
❌ No se redirige porque: connected=false
```

**Significa**: El servidor no marcó `connected: true`

**Verificar en servidor**: Los logs del servidor deberían mostrar:

```
--- Callback Redirect Debug ---
Connected: false
Final Redirect URL: /
```

**Posible causa**: El `exchangeCodeForSession` falló o la sesión no se verificó

### Caso 2: `redirectUrl` vacío

```
❌ No se redirige porque: redirectUrl vacío
```

**Significa**: El servidor tiene `connected=true` pero `redirectUrl` no se asignó

**Verificar en servidor**:

```
Final Redirect URL: undefined
```

**Posible causa**: Ninguna de las condiciones de redirección se cumplió

## 3️⃣ Logs del Servidor

En la consola del servidor verás:

```
📤 Retornando result al cliente: {
  connected: true,
  redirectUrl: "/dashboard",
  message: "Verificado correctamente. Redirigiendo..."
}
```

## 4️⃣ Verificación paso a paso

### En la URL del callback

```
https://auth.interfundeoms.edu.co/callback?code=ABC123&system=myapp&redirectTo=/dashboard
```

**Server debe hacer:**

1. ✅ Leer `code`, `system`, `redirectTo`
2. ✅ Ejecutar `exchangeCodeForSession(code)`
3. ✅ Verificar sesión: `await supabase.auth.getSession()`
4. ✅ Leer parámetros de redirección
5. ✅ Asignar `result.redirectUrl = "/dashboard"` (porque hay `redirectTo`)
6. ✅ Asignar `result.connected = true`
7. ✅ Retornar `result` al cliente

**Client debe hacer:**

1. ✅ Recibir datos en `onMount`
2. ✅ Verificar `data.connected && data.redirectUrl`
3. ✅ Ejecutar `window.location.replace(data.redirectUrl)`

## 5️⃣ Si aún no funciona

### A. Verifica que el `redirectUrl` se está asignando

En `src/routes/callback/+page.server.ts`, la lógica es:

```typescript
if (type === "recovery") {
  // ... recovery logic
} else if (redirectTo) {
  result.redirectUrl = redirectTo; // ← AQUÍ si hay redirectTo
} else {
  const brandConfig = resolveBrand(system);
  if (brandConfig && brandConfig.redirectUrlAfterLogin) {
    result.redirectUrl = brandConfig.redirectUrlAfterLogin; // ← O AQUÍ
  } else {
    result.redirectUrl = DEFAULT_REDIRECT_URL; // ← O AQUÍ (fallback)
  }
}
```

### B. Verifica que `result.connected` es `true`

En `src/routes/callback/+page.server.ts`:

```typescript
if (!session) {
  result.message = "No se pudo establecer la sesión...";
  return result; // ← Si no hay sesión, se retorna SIN connected=true
}

// Solo aquí se asigna connected=true
result.connected = true;
```

### C. Verifica en el cliente que se recibe correctamente

En `src/routes/callback/+page.svelte`:

```typescript
export let data: PageData; // ← Aquí llegan los datos del servidor

// Si esto es false, no habrá redirección
if (data.connected && data.redirectUrl) {
  // ← Se redirige
}
```

## 6️⃣ Solución Rápida

Si los logs muestran que `connected=true` pero `redirectUrl` está vacío, asegúrate que:

1. **`redirectTo` viene en la URL**:

   ```
   ?code=...&redirectTo=/ruta
   ```

2. **O `system` viene en la URL y tiene configuración**:

   ```
   ?code=...&system=myapp
   ```

   Donde `myapp` está configurado en `brandConfig.ts`

3. **O por lo menos `DEFAULT_REDIRECT_URL` está definido**

## 7️⃣ Test Manual

```bash
# Test 1: Con redirectTo
http://localhost:5173/callback?code=test&redirectTo=/dashboard

# Test 2: Con system
http://localhost:5173/callback?code=test&system=auth

# Test 3: Sin parámetros (debe ir a DEFAULT_REDIRECT_URL o /)
http://localhost:5173/callback?code=test
```

## 8️⃣ Si el problema persiste

1. Abre DevTools → Console
2. Verifica los logs del cliente (`📥 Datos recibidos...`)
3. Abre servidor logs (terminal/stdout)
4. Busca los logs del servidor (`📤 Retornando result al cliente...`)
5. Compara ambos

---

## 🔧 Cambios Recientes (para esta sesión)

✅ Añadido logging mejorado en servidor  
✅ Añadido logging mejorado en cliente  
✅ Garantía: Si `connected=true`, siempre hay un `redirectUrl` válido  
✅ Garantía: Si falla, se redirige a `/` como fallback

La redirección **debe funcionar ahora**.

Si aún no funciona, el problema está en:

- La sesión no se está creando (error en `exchangeCodeForSession`)
- Los parámetros no se están leyendo correctamente
- Hay un error JavaScript en el cliente que previene la ejecución

Revisa los logs para identificar exactamente dónde falla.
