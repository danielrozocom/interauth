# Configuración de Supabase Auth

## Variables de Entorno Requeridas en Supabase

Para que este intermediario funcione correctamente, debes configurar las siguientes variables en tu instancia de Supabase (self-hosted):

### GOTRUE_URI_ALLOW_LIST

Esta variable debe contener todas las URLs de redirección permitidas, separadas por comas:

```env
ADDITIONAL_REDIRECT_URLS=https://pos.interfundeoms.edu.co/*,https://app.interfundeoms.edu.co/*,http://localhost:5173/*
```

### GOTRUE_EXTERNAL_GOOGLE_ENABLED

Habilita Google como proveedor de OAuth:

```env
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
```

### GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID

Tu Client ID de Google OAuth:

```env
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

### GOTRUE_EXTERNAL_GOOGLE_SECRET

Tu Client Secret de Google OAuth:

```env
GOTRUE_EXTERNAL_GOOGLE_SECRET=tu-client-secret
```

## Configuración de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+
4. Ve a "Credenciales" y crea credenciales OAuth 2.0
5. Agrega las URIs de redirección autorizadas:
   - `https://tu-supabase-url.supabase.co/auth/v1/callback`
6. Copia el Client ID y Client Secret

## URLs de Callback en las Aplicaciones Hijas

Cada aplicación hija (InterPOS, Admin, Tienda) debe tener una ruta `/auth/callback` que maneje el token de Supabase.

Ejemplo en SvelteKit:

```typescript
// src/routes/auth/callback/+page.server.ts
import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals }) => {
  const code = url.searchParams.get("code");

  if (code) {
    await locals.supabase.auth.exchangeCodeForSession(code);
  }

  throw redirect(303, "/dashboard");
};
```

## Verificación de la Configuración

Para verificar que todo está configurado correctamente:

1. Abre el navegador en modo incógnito
2. Visita: `http://localhost:5173/?system=pos` o `http://localhost:5173/?system=app`
3. Haz clic en "Continuar con Google"
4. Deberías ser redirigido a la pantalla de login de Google
5. Después del login, deberías ser redirigido a la URL configurada

## Troubleshooting

### Error: "Invalid redirect URL"

- Verifica que la URL esté en `GOTRUE_URI_ALLOW_LIST`
- Asegúrate de que no haya espacios extra en la variable

### Error: "Google OAuth not configured"

- Verifica las variables `GOTRUE_EXTERNAL_GOOGLE_*`
- Confirma que Google OAuth esté habilitado en tu proyecto de Google Cloud

### El usuario no es redirigido después del login

- Verifica que la aplicación hija tenga la ruta `/auth/callback`
- Revisa los logs de Supabase para ver errores
