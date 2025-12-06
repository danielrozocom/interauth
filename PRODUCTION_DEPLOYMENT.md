# 🚀 Production vs Development Deployment Guide

## Overview

Este proyecto tiene **dos configuraciones diferentes** para desarrollo y producción:

| Aspecto | Development | Production |
|--------|-------------|------------|
| **Dockerfile** | `Dockerfile.dev` | `Dockerfile` |
| **Docker Compose** | `docker-compose.dev.yml` | `docker-compose.prod.yml` |
| **Server** | Vite Dev Server | Vite Preview Server |
| **Port** | 5173 | 3000 |
| **Hot Reload** | ✅ Yes | ❌ No |
| **npm script** | `pnpm dev` | `pnpm start` |

---

## 🛠️ Local Development

Para desarrollar localmente, usa el Dockerfile de desarrollo y docker-compose:

```bash
# Opción 1: Docker Compose (recomendado)
docker-compose -f docker-compose.dev.yml up

# Opción 2: Vite dev server directo (sin Docker)
pnpm dev
```

**Resultado esperado:**
```
> interauth@1.0.0 dev /app
> vite dev --host 0.0.0.0 --port 5173

  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://x.x.x.x:5173/
```

---

## 🏭 Production Deployment

Para producción, usa el Dockerfile optimizado (multi-stage) y docker-compose.prod.yml:

```bash
# Opción 1: Docker Compose (recomendado para testing)
docker-compose -f docker-compose.prod.yml up

# Opción 2: Build y run manual
docker build -t interauth:latest .
docker run -p 3000:3000 \
  -e SUPABASE_URL="your_url" \
  -e SUPABASE_ANON_KEY="your_key" \
  -e APP_NAME="InterAuth" \
  interauth:latest
```

**Resultado esperado en logs:**
```
═══════════════════════════════════════════════════════════════
  InterAuth Production Server - Starting
═══════════════════════════════════════════════════════════════

🔧 Configuration:
   App Name:        InterAuth
   Supabase URL:    supabase ✓
   Anon Key:        eyJx...tKBw ✓
   Server Port:     3000
   Server Host:     0.0.0.0
   Node Env:        production

✓ Build artifacts found

🚀 Starting built application...

────────────────────────────────────────────────────────────

Listening on 0.0.0.0:3000
```

**NUNCA debe aparecer:**
```
> interauth@1.0.0 dev /app
> vite dev --host 0.0.0.0 --port 5173
```

---

## 🔑 Key Files Explanation

### `Dockerfile` (Production)
- **Multi-stage build:** Reduces final image size
- **Stage 1 (builder):** Instala dependencias y compila la app
- **Stage 2 (runner):** Copia solo los artefactos compilados
- **CMD:** `["pnpm", "start"]` → Ejecuta `vite preview`
- **No dev dependencies** en la imagen final

### `Dockerfile.dev` (Development)
- **Single stage:** Más simple y rápido para desarrollo
- **Incluye:** Hot reload, file watching
- **CMD:** `["pnpm", "dev"]` → Ejecuta Vite dev server
- **Volumes:** Monta la carpeta local para cambios en tiempo real

### `server.js` (Production Entry Point)
- Valida variables de entorno requeridas
- Verifica que los artefactos de build existan
- Inicia el servidor Node.js compilado
- Manejo de señales para shutdown graceful

### `package.json` Scripts
```json
{
  "dev": "vite dev --host 0.0.0.0 --port 5173",    // Development
  "build": "vite build",                             // Build production
  "start": "vite preview --host 0.0.0.0 --port 3000" // Production
}
```

---

## 🚨 Troubleshooting

### Si ves `vite dev` en producción:

**Causa probable:** Estás usando `Dockerfile.dev` en lugar de `Dockerfile`

**Solución:**
```bash
# ❌ Malo - Usa development Dockerfile
docker build -f Dockerfile.dev -t interauth .

# ✅ Bueno - Usa production Dockerfile
docker build -f Dockerfile -t interauth .
# o simplemente (por defecto busca 'Dockerfile')
docker build -t interauth .
```

### Si ves `Cannot find build entry: /app/build/index.js`:

**Causa:** El contenedor no ejecutó `pnpm run build` antes de iniciar

**Solución:**
- Asegúrate de que el Dockerfile tiene `RUN pnpm run build`
- Verifica que el build completó exitosamente antes de pasar a la siguiente etapa

### Si el server no responde en puerto 3000:

**Verificar:**
```bash
# Dentro del contenedor
docker exec <container_id> curl http://localhost:3000

# O desde el host
curl http://localhost:3000
```

---

## 📋 Deployment Checklist

Antes de deployar a producción:

- [ ] ✅ Se usó `docker build -f Dockerfile` (no Dockerfile.dev)
- [ ] ✅ Se usó `docker-compose.prod.yml` (no docker-compose.dev.yml)
- [ ] ✅ Variables de entorno configuradas en la plataforma:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `APP_NAME`
- [ ] ✅ Build completó sin errores
- [ ] ✅ Logs muestran "InterAuth Production Server - Starting"
- [ ] ✅ Logs muestran "Listening on 0.0.0.0:3000" (NO vite dev server)
- [ ] ✅ Health check responde en `http://container:3000`

---

## 📚 Related Files

- `Dockerfile` - Production multi-stage build
- `Dockerfile.dev` - Development single-stage build
- `docker-compose.prod.yml` - Production orchestration (NEW)
- `docker-compose.dev.yml` - Development orchestration
- `server.js` - Production entry point
- `package.json` - Scripts definition
- `vite.config.ts` - Vite configuration
- `svelte.config.js` - SvelteKit configuration
- `nixpacks.toml` - Nixpacks configuration (alternative build system)

---

## 🔗 References

- [SvelteKit Deployment Docs](https://kit.svelte.dev/docs/adapter-node)
- [Vite Preview Docs](https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
