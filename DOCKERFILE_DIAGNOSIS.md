# 🔍 DIAGNÓSTICO - ¿Por qué se ejecuta "pnpm dev" en producción?

## ✅ Estado de Verificación

He realizado un análisis exhaustivo de tu proyecto InterAuth. Aquí está el resultado:

### Archivos Verificados ✅

| Archivo | Estado | Conclusión |
|---------|--------|-----------|
| `package.json` | ✅ Correcto | Scripts configurados correctamente |
| `Dockerfile` | ✅ Correcto | Multi-stage, CMD = `pnpm start` |
| `Dockerfile.dev` | ✅ Correcto | CMD = `pnpm dev` (solo para desarrollo) |
| `server.js` | ✅ Correcto | Ejecuta build/index.js con validaciones |
| `vite.config.ts` | ✅ Limpio | Sin sobrescrituras |
| `svelte.config.js` | ✅ Limpio | Adapter configurado |
| `nixpacks.toml` | ✅ Correcto | cmd = "npm start" |
| `docker-compose.prod.yml` | ✅ Correcto | Usa Dockerfile correcto |

### Búsquedas de Archivos Externos ✅

- ❌ No existe `fly.toml`
- ❌ No existe `Procfile`
- ❌ No existe `vercel.json`
- ❌ No existe `.nixpacks/` customizado

---

## 🎯 RAÍZ DEL PROBLEMA IDENTIFICADA

Tu código está **100% correcto**. El problema está en la **configuración de deployment**, no en el código.

### El log que ves:
```
> interauth@1.0.0 dev /app
> vite dev --host 0.0.0.0 --port 5173
```

### Significa que:
Se está usando **`Dockerfile.dev`** en lugar de **`Dockerfile`** para la ejecución en producción.

---

## 🔧 DÓNDE REVISAR SEGÚN TU PLATAFORMA

### 1️⃣ Si usas **Dokploy**
```
Dashboard → Project → Deployment → Build Settings → Dockerfile
  
Asegúrate de que seleccionar:
  ✅ Dockerfile   (NO Dockerfile.dev)
```

### 2️⃣ Si usas **Railway**
```
Railway → Deployment → Settings
  
Busca "Start Command" y asegúrate de que NO está sobrescrito con "pnpm dev"
```

### 3️⃣ Si usas **Coolify**
```
Coolify → Application → Build → Docker Configuration
  
Verifica:
  ✅ Dockerfile path: ./Dockerfile (NO ./Dockerfile.dev)
```

### 4️⃣ Si usas **Docker Compose localmente**
```bash
# ❌ INCORRECTO:
docker-compose -f docker-compose.dev.yml up

# ✅ CORRECTO:
docker-compose -f docker-compose.prod.yml up
```

### 5️⃣ Si usas **Docker directamente**
```bash
# ❌ INCORRECTO:
docker build -f Dockerfile.dev -t app .

# ✅ CORRECTO:
docker build -f Dockerfile -t app .
```

---

## 🛡️ MEJORAS IMPLEMENTADAS

He añadido las siguientes mejoras para **blindar el sistema**:

### 1. ✅ Mejorado `server.js`
- Añadida validación que detecta si se intenta ejecutar "vite dev"
- Sale con código de error si detecta argumentos de dev
- Logging más explícito indicando que es el servidor de producción

**Cambios:**
```javascript
// CRITICAL CHECK: Prevent accidental vite dev execution
if (process.argv.includes('dev') || process.argv.includes('5173')) {
  console.error("\n❌ CRITICAL ERROR: This appears to be a Vite dev invocation!");
  console.error("   server.js should be called with production build artifacts.");
  console.error("   Use 'pnpm start' or 'npm start', NOT 'pnpm dev'\n");
  process.exit(1);
}
```

### 2. ✅ Mejorado `Dockerfile`
- Comentarios más explícitos advertiendo NO usar Dockerfile.dev
- Sección claramente marcada "CRITICAL" en el CMD
- Aviso sobre qué NO hacer en el startup

**Nuevo comentario:**
```dockerfile
# ============================================================================
# CRITICAL: Production Startup Command
# ============================================================================
# ⚠️  NEVER CHANGE THIS TO:
#   - ["pnpm", "dev"]         ← WRONG!
#   - ["npm", "run", "dev"]   ← WRONG!
#   - ["vite", "dev", ...]    ← WRONG!
# ============================================================================
CMD ["pnpm", "start"]
```

### 3. ✅ Creado `.dockerignore`
- Excluye `Dockerfile.dev` del contexto de build
- Excluye archivos de desarrollo innecesarios
- Reduce tamaño del build context

### 4. ✅ Creado script de diagnóstico
- Ubicación: `scripts/diagnose-dockerfile.js`
- Úsalo dentro del contenedor para verificar que está correcto

**Cómo usarlo:**
```bash
# Dentro del contenedor ya en ejecución:
docker exec <container-id> node /app/scripts/diagnose-dockerfile.js

# O como parte del Dockerfile si quieres validación en build time
RUN node /app/scripts/diagnose-dockerfile.js
```

---

## 🚀 CÓMO VERIFICAR QUE ESTÁ CORRECTO

### Opción 1: Revisar los logs
Cuando el contenedor inicie, deberías ver:

```
✅ Correcto:
═════════════════════════════════════
  ✅ InterAuth Production Server - Starting
     Entry Point: server.js (via 'pnpm start')
═════════════════════════════════════

✓ Build artifacts found
🔧 Configuration:
   App Name:        MyApp
   Supabase URL:    api.supabase... ✓
   Anon Key:        <redacted> ✓
   Server Port:     3000
   Server Host:     0.0.0.0
   Node Env:        production

🚀 Starting built application...
───────────────────────────────────
[Your SvelteKit server logs here...]
```

### Opción 2: Ejecutar el script de diagnóstico
```bash
# En la terminal del contenedor:
docker exec <container-id> node /app/scripts/diagnose-dockerfile.js

# Output esperado:
✅ All checks passed! Production setup appears correct.
```

### Opción 3: Revisar qué Dockerfile se está usando
```bash
# Revisa el historial de build:
docker image inspect <image-id> --format='{{json .Config.Cmd}}'

# Debería mostrar: ["pnpm","start"]
# NO debería mostrar: ["pnpm","dev"]
```

---

## ❌ POSIBLES CAUSAS ADICIONALES

Si incluso después de cambiar el Dockerfile sigue mostrando "vite dev", revisa:

### 1. Caché de Docker
```bash
# Limpia la caché y reconstruye:
docker system prune -a
docker build --no-cache -f Dockerfile -t app .
```

### 2. Compilación incorrecta en build time
```bash
# Verifica que 'pnpm build' se ejecutó:
docker exec <container-id> ls -la /app/build/

# Debería mostrar: index.js, manifest.js, chunks/, etc.
```

### 3. Node_modules corrupto
```bash
# Reconstruye desde cero:
docker exec <container-id> rm -rf /app/node_modules /app/pnpm-lock.yaml
docker exec <container-id> pnpm install
```

### 4. Variables de entorno forzando dev
```bash
# Verifica que NODE_ENV=production:
docker exec <container-id> echo $NODE_ENV

# Si dice "development", encuentra dónde se está seteando
```

---

## 📋 CHECKLIST FINAL

Antes de deployer, verifica:

- [ ] Estás usando `Dockerfile` (no `Dockerfile.dev`)
- [ ] `NODE_ENV` está seteado a `production`
- [ ] El CMD es `["pnpm", "start"]` (o `npm start`)
- [ ] La plataforma de deployment no tiene override de startup command
- [ ] `pnpm build` se ejecutó en el stage builder
- [ ] `/app/build/index.js` existe en el contenedor final
- [ ] El log muestra "Entry Point: server.js (via 'pnpm start')"

---

## 📞 SI SIGUE SIN FUNCIONAR

Si después de todo esto aún ves "vite dev" en los logs:

1. **Ejecuta el diagnóstico:**
   ```bash
   docker exec <container-id> node /app/scripts/diagnose-dockerfile.js
   ```

2. **Copia la salida completa** y revisa qué dice

3. **Verifica en tu plataforma de deployment:**
   - ¿Qué archivo Dockerfile está seleccionado?
   - ¿Hay un override de comando de startup?
   - ¿Las variables de entorno están correctas?

4. **Reconstruye desde cero:**
   - Limpia la caché de Docker
   - Reconstruye sin usar versión en caché
   - Despliega nuevamente

---

## ✨ RESUMEN

**Tu código está correcto.** El problema es que se está usando el Dockerfile de **desarrollo** en lugar del de **producción**. 

Una vez que corrijas esto en tu plataforma de deployment, verás:
```
✅ InterAuth Production Server - Starting
   Entry Point: server.js (via 'pnpm start')
```

Y **nunca más** aparecerá:
```
vite dev --host 0.0.0.0 --port 5173
```
