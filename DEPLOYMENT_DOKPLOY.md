# Despliegue en Dokploy (rápido y ligero)

Esta guía rápida explica cómo asegurar que Dokploy use el Dockerfile de producción (ligero) y evitar que ejecute `pnpm dev` (vite dev) por error.

## Resumen breve

- Usa `Dockerfile` (archivo raíz) para producción — NO uses `Dockerfile.dev`.
- Asegúrate de que el comando de arranque no esté sobrescrito: debe ser `pnpm start` (o dejar que el CMD del Dockerfile se aplique).

  ⚠️ Nota: Si ves un error en la fase de build diciendo `/bin/sh: pnpm: not found`, asegúrate de que el `Dockerfile` de producción habilite corepack/pnpm en la etapa `runner`. El `Dockerfile` debe contener algo como:

```Dockerfile
# In the runner stage
RUN npm install -g corepack@0.24.1 && corepack enable
```

Esto garantiza que `pnpm` esté disponible cuando el contenedor instale solo dependencias de producción o ejecute `pnpm start`.

- Establece `NODE_ENV=production` en las variables de entorno de Dokploy.

---

## Pasos en Dokploy (UI)

1. Entra al Dashboard → Project → Deployment → Build Settings → _Dockerfile_

   - Selecciona `Dockerfile` (ruta: `./Dockerfile`).
   - No selecciones `Dockerfile.dev`.

2. Revisa el startup/command si tu plataforma lo permite (Deployment → Settings)

   - Asegúrate que no esté forzado `pnpm dev`.
   - Si te piden un comando de inicio, pon `pnpm start`.

3. Variables de entorno

   - Asegúrate de definir: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `APP_NAME`.
   - Añade `NODE_ENV=production` (no obligatorio si el contenedor ya lo define, pero recomendado).

4. Re-deploy
   - Inicia un nuevo despliegue después de verificar los pasos anteriores.

---

## Verificación de logs (qué deberías ver)

- En vez de ver: `> interauth@1.0.0 dev /app` o `vite dev --host 0.0.0.0 --port 5173` deberías ver:

```
✅ InterAuth Production Server - Starting
Entry Point: server.js (via 'pnpm start')
```

- El `server.js` validará que no se inició the dev server; si detecta `pnpm dev`, terminará con un error y lo verás en los logs.

---

## Cómo probar localmente (simular Dokploy con Docker)

```bash
# Construir usando el Dockerfile de producción
docker build -f Dockerfile -t interauth:prod .

# Correr contenedor (asegúrate de pasar variables necesarias)
docker run -p 3000:3000 -e NODE_ENV=production \
  -e SUPABASE_URL=<tu_url> \
  -e SUPABASE_ANON_KEY=<tu_anon_key> \
  -e APP_NAME=interauth interauth:prod
```

- Logs esperados: verás el arranque de `server.js` (no `vite dev`).

---

## Si aún aparece `vite dev` en Dokploy

- Revisa que Dokploy **no esté** construyendo con `Dockerfile.dev` (configuración de build).
- Revisa que no haya override del comando de inicio (start command).
- Limpia caché de Docker y rebuild (local):

```bash
docker system prune -a
docker build --no-cache -f Dockerfile -t interauth:prod .
```

- Ejecuta el script de diagnóstico dentro del contenedor:

```bash
docker run -d --name debug_interauth interauth:prod
# luego
docker exec -it debug_interauth node /app/scripts/diagnose-dockerfile.js
```

---

## Notas finales

- `Dockerfile` (producción) ya está optimizado: multi-stage build y `pnpm start`.
- `Dockerfile.dev` está sólo para desarrollo local; no debe usarse en Dokploy.

Si quieres, puedo:

- Añadir esta guía a tu README en español automáticamente (lo hice aquí como `DEPLOYMENT_DOKPLOY.md`).
- Simular un build para ti y confirmar el resultado (dímelo y ejecuto los comandos locales si quieres).
