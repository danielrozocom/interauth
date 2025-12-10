# OAuth Flow Diagram - InterAuth

## Flujo Completo OAuth (Google + Supabase Self-Hosted)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUARIO EN CLIENTE                          │
│                                                                     │
│  1. Click en "Login con Google"                                    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ├──> Redirige a Google OAuth
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH PROVIDER                           │
│                                                                     │
│  2. Usuario se autentica y autoriza                               │
│  3. Google genera código temporal                                  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ├──> Redirect a /callback?code=ABC123&system=...
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INTERAUTH /callback (Server)                    │
│                                                                     │
│  src/routes/callback/+page.server.ts                              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ PASO 1: Detectar Parámetros (líneas 3-15)               │   │
│  │ ────────────────────────────────────────────            │   │
│  │ const code = url.searchParams.get("code")               │   │
│  │ const redirectTo = url.searchParams.get("redirectTo")   │   │
│  │ const system = url.searchParams.get("system")           │   │
│  │ const type = url.searchParams.get("type")               │   │
│  └───────────────────────────────────────────────────────────┘   │
│                         │                                          │
│                         ▼                                          │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ PASO 2: Validar Code (línea 39)                          │   │
│  │ ──────────────────────────────────────────────            │   │
│  │                                                            │   │
│  │  ¿Existe 'code'?                                         │   │
│  │  ├─ NO → Retorna error "No se recibió código"           │   │
│  │  │        (No redirige aún)                             │   │
│  │  │                                                        │   │
│  │  └─ SI → Continúa al siguiente paso                     │   │
│  └────────────┬──────────────────────────────────────────────┘   │
│               ▼                                                    │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ PASO 3: EJECUTAR exchangeCodeForSession (línea 51) ✨   │   │
│  │ ──────────────────────────────────────────────────────   │   │
│  │                                                            │   │
│  │  const { error: exchangeError } =                        │   │
│  │    await supabase.auth.exchangeCodeForSession(code!)    │   │
│  │                                                            │   │
│  │  ← AQUÍ SUCEDE LA MAGIA: Se valida el código            │   │
│  │    y se establece una sesión con Supabase               │   │
│  └────────────┬──────────────────────────────────────────────┘   │
│               ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PASO 4: ¿Error en exchange? (línea 52)               │    │
│  │ ──────────────────────────────────────────────        │    │
│  │                                                         │    │
│  │  ┌─ SÍ: Error (ej: código expirado)                  │    │
│  │  │     ├─ Log: "Error al establecer sesión"         │    │
│  │  │     ├─ Construir URL de error (líneas 55-58)     │    │
│  │  │     │   errorParams = {                          │    │
│  │  │     │     error: "oauth_failed",                 │    │
│  │  │     │     description: error.message,            │    │
│  │  │     │     system: system                         │    │
│  │  │     │   }                                        │    │
│  │  │     ├─ result.redirectUrl = "/error?..."         │    │
│  │  │     └─ return result (fin del proceso)           │    │
│  │  │                                                    │    │
│  │  └─ NO: Exchange exitoso → Continúa                  │    │
│  └────────────┬──────────────────────────────────────────┘    │
│               ▼                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ PASO 5: Verificar Sesión (línea 64)                 │  │
│  │ ───────────────────────────────────────────────     │  │
│  │                                                      │  │
│  │  const { data: { session } } =                     │  │
│  │    await supabase.auth.getSession()                │  │
│  │                                                      │  │
│  │  ¿Sesión válida?                                   │  │
│  │  ├─ NO → Retorna error "No se pudo establecer"    │  │
│  │  │                                                  │  │
│  │  └─ SI → Continúa al siguiente paso                │  │
│  └────────────┬──────────────────────────────────────────┘  │
│               ▼                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ PASO 6: GUARDAR SESIÓN EN COOKIES (Automático) ✨    ││
│  │ ──────────────────────────────────────────────────  ││
│  │                                                     ││
│  │ Via createSupabaseServerClient en hooks.server.ts  ││
│  │ Las cookies se guardan automáticamente con:        ││
│  │ ├─ sameSite: "lax"                                 ││
│  │ ├─ secure: true (HTTPS)                            ││
│  │ ├─ domain: ".interfundeoms.edu.co"                 ││
│  │ └─ path: "/"                                       ││
│  │                                                     ││
│  │ Cookie guardada: sb-*-auth-token=JWT               ││
│  └────────────┬──────────────────────────────────────────┘│
│               ▼                                             │
│  ┌─────────────────────────────────────────────────────────┐
│  │ PASO 7: Determinar URL de Destino (líneas 82-104) │
│  │ ──────────────────────────────────────────────   │
│  │                                                    │
│  │  result.connected = true;                        │
│  │                                                    │
│  │  ¿Qué tipo de login?                             │
│  │                                                    │
│  │  ├─ type === "recovery"?                         │
│  │  │  └─ Redirige a /reset-password (líneas 84-94)│
│  │  │     (Flujo de recuperación de contraseña)     │
│  │  │                                                │
│  │  ├─ redirectTo existe?                           │
│  │  │  └─ Redirige a redirectTo (línea 97)         │
│  │  │     (URL personalizada del cliente)           │
│  │  │                                                │
│  │  └─ Ninguno?                                     │
│  │     ├─ Resuelve brand config (línea 99)         │
│  │     └─ Redirige a brandConfig.redirectUrlAfterLogin │
│  │        o DEFAULT_REDIRECT_URL (línea 104)       │
│  │                                                    │
│  └────────────┬──────────────────────────────────────┘
│               ▼                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ PASO 8: Retornar Resultado (línea 111)         ││
│  │ ────────────────────────────────────────────── ││
│  │                                                  ││
│  │  return {                                      ││
│  │    connected: true,                            ││
│  │    message: "Verificado correctamente...",     ││
│  │    redirectUrl: "/dashboard",                  ││
│  │    isRecovery: false                           ││
│  │  }                                             ││
│  │                                                 ││
│  └──────────────┬──────────────────────────────────┘
│                 ▼
│  El client (+page.svelte) recibe estos datos
│  y ejecuta: window.location.replace(redirectUrl)
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Redirecciones Posibles:  │
        │                          │
        ├─ SUCCESS:               │
        │  /dashboard              │
        │  /app                    │
        │  /reset-password         │
        │  (según config)          │
        │                          │
        └─ ERROR:                 │
           /error?error=          │
           oauth_failed&          │
           description=...        │
        └──────────────────────────┘
```

---

## Flujo de Error Detallado

```
ERROR EN exchangeCodeForSession
│
├─ Error: "invalid_grant" (código expirado)
├─ Error: "invalid_client" (cliente incorrecto)
├─ Error: "access_denied" (usuario rechazó)
├─ Error: (cualquier otro error Supabase)
│
▼
┌──────────────────────────────────────────────────────────┐
│ /error?error=oauth_failed&                               │
│        description=<error.message>&                      │
│        system=<system>                                   │
└──────────────────────────────────────────────────────────┘
                    │
                    ▼
        ┌────────────────────────┐
        │ src/routes/error/      │
        │ +page.svelte           │
        │                        │
        │ ✓ Icono de error       │
        │ ✓ Mensaje amigable     │
        │ ✓ Detalles técnicos    │
        │ ✓ Botón: Reintentar   │
        │ ✓ Botón: Volver a /   │
        └────────────────────────┘
```

---

## Flujo de Recuperación Detallado

```
Email de Recuperación desde Supabase
│
├─ URL: /callback?
│  type=recovery&
│  access_token=...&
│  refresh_token=...&
│  system=...
│
▼
┌──────────────────────────────────────────────────────────┐
│ callback/+page.server.ts                                 │
│                                                          │
│ 1. Detecta type === "recovery"                          │
│ 2. NO ejecuta exchangeCodeForSession                    │
│    (Los tokens ya están en el enlace)                   │
│ 3. Forward tokens a /reset-password                    │
└──────────────────────────────────────────────────────────┘
        │
        ▼
/reset-password?
  type=recovery&
  access_token=...&
  refresh_token=...&
  system=...
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│ reset-password/+page.svelte                              │
│                                                          │
│ 1. Muestra formulario de nueva contraseña               │
│ 2. Usuario ingresa contraseña                           │
│ 3. Usa access_token + refresh_token para               │
│    actualizar contraseña en Supabase                   │
│ 4. Luego redirige a login o dashboard                 │
└──────────────────────────────────────────────────────────┘
```

---

## Almacenamiento de Sesión en Cookies

```
┌─────────────────────────────────────────────────────┐
│ exchangeCodeForSession(code) SUCCESS                 │
└────────────────┬──────────────────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ Supabase Retorna:                │
    │ ├─ access_token (JWT)            │
    │ ├─ refresh_token                 │
    │ ├─ user data                     │
    │ └─ expires_in                    │
    └────────────┬───────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ createSupabaseServerClient       │
    │ Maneja cookies automáticamente:  │
    │                                   │
    │ cookies.set(key, value, {        │
    │   path: "/",                     │
    │   domain: ".interf...edu.co",    │
    │   sameSite: "lax",               │
    │   secure: true                   │
    │ })                               │
    └────────────┬───────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ Cookies Guardadas en el Cliente: │
    │                                   │
    │ sb-{project-id}-auth-token       │
    │   = JWT + refresh token info     │
    │                                   │
    │ Alcance:                         │
    │ ├─ Path: /                       │
    │ ├─ Domain: .interfundeoms...     │
    │ ├─ Secure: ✓ (HTTPS only)       │
    │ └─ SameSite: Lax                 │
    └────────────┬───────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ Navegador Envía Cookie en:       │
    │                                   │
    │ Todas las request a:             │
    │ ├─ auth.interfundeoms.edu.co    │
    │ ├─ app.interfundeoms.edu.co     │
    │ ├─ pos.interfundeoms.edu.co     │
    │ └─ (otros subdominios)          │
    │                                   │
    │ Header: Cookie: sb-...-auth-...  │
    └──────────────────────────────────┘
```

---

## Casos de Uso - Matriz de Decisión

```
┌─────────────────────────────────────────────────────────────┐
│ PARÁMETROS RECIBIDOS → ACCIÓN A EJECUTAR                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. code=X & type≠recovery                                 │
│    └─> exchangeCodeForSession(X) ✓ NORMAL OAuth          │
│                                                             │
│ 2. code=X & type=recovery                                 │
│    └─> NO exchange, forward tokens RECOVERY              │
│                                                             │
│ 3. code=INVALID & type≠recovery                           │
│    └─> Error: exchange falla → /error OAuth              │
│                                                             │
│ 4. code=null & type≠recovery                              │
│    └─> Error: no code → Muestra en página               │
│                                                             │
│ 5. type=recovery & access_token=X & refresh_token=Y       │
│    └─> Forward a /reset-password RECOVERY                │
│                                                             │
│ 6. code=X & redirectTo=/app                               │
│    └─> Exchange + Redirige a /app PERSONALIZADO          │
│                                                             │
│ 7. code=X & system=school                                 │
│    └─> Exchange + Config de school BRANDED               │
│                                                             │
│ 8. code=X sin redirectTo ni system                        │
│    └─> Exchange + Redirige a / DEFAULT                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Timeline de Ejecución

```
t=0ms    Solicitud llega a /callback?code=ABC
         ├─ Detecta parámetros (2ms)
         │
t=2ms    ├─ Valida code (1ms)
         │
t=3ms    ├─ EJECUTA exchangeCodeForSession(ABC)
         │  │
         │  └─ Llamada a Supabase API (50-200ms típico)
         │
t=53ms   ├─ Recibe respuesta
         │  ├─ ¿Error? NO
         │  └─ Sesión válida? SÍ
         │
t=55ms   ├─ Determina redirectUrl (2ms)
         │
t=57ms   ├─ Retorna result al cliente
         │
t=58ms   └─ Cliente redirige a destino
              └─ window.location.replace(redirectUrl)

TOTAL: ~60ms (la mayoría es latencia Supabase)

⚠️  NUNCA se redirige antes de t=53ms
✓  Garantiza que exchange se completa
```

---

## Estados de Response

```
┌─────────────────────────────────────────────────────────┐
│ RESPONSE EXITOSO                                        │
├─────────────────────────────────────────────────────────┤
│ {                                                       │
│   connected: true,                                      │
│   message: "Verificado correctamente. Redirigiendo...",│
│   redirectUrl: "/dashboard",                           │
│   isRecovery: false                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ RESPONSE ERROR OAuth                                    │
├─────────────────────────────────────────────────────────┤
│ {                                                       │
│   connected: false,                                     │
│   message: "invalid_grant",                            │
│   redirectUrl: "/error?error=oauth_failed&             │
│               description=invalid_grant&               │
│               system=auth",                            │
│   isRecovery: false                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ RESPONSE SIN CODE                                       │
├─────────────────────────────────────────────────────────┤
│ {                                                       │
│   connected: false,                                     │
│   message: "No se recibió ningún código...",           │
│   redirectUrl: "/",                                     │
│   isRecovery: false                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ RESPONSE RECUPERACIÓN                                   │
├─────────────────────────────────────────────────────────┤
│ {                                                       │
│   connected: true,                                      │
│   message: "Verificado correctamente. Redirigiendo...",│
│   redirectUrl: "/reset-password?type=recovery&         │
│               access_token=...&refresh_token=...",     │
│   isRecovery: true                                      │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Conclusión

```
        ┌──────────────────────────────────┐
        │   GOOGLE OAUTH FLOW COMPLETO     │
        │   ✓ Seguro                       │
        │   ✓ Robusto                      │
        │   ✓ Documentado                  │
        │   ✓ Listo para Producción        │
        │                                   │
        │  Implementación: 10 Dic 2025      │
        └──────────────────────────────────┘
```
