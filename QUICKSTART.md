# 🚀 Quick Start - InterAuth

## Instalación Rápida (5 minutos)

### 1️⃣ Instalar dependencias
```bash
pnpm install
```

### 2️⃣ Configurar Supabase
Crea un archivo `.env`:
```bash
copy .env.example .env
```

Edita `.env`:
```env
VITE_SUPABASE_URL=https://tu-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 3️⃣ Iniciar desarrollo
```bash
pnpm dev
```

### 4️⃣ Probar
Abre en tu navegador:
- **InterPOS**: http://localhost:5173/?system=interpos
- **Admin**: http://localhost:5173/?system=admin
- **Tienda**: http://localhost:5173/?system=tienda

---

## ⚡ Comandos Esenciales

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Iniciar servidor de desarrollo |
| `pnpm build` | Compilar para producción |
| `pnpm preview` | Previsualizar build de producción |
| `pnpm check` | Verificar tipos TypeScript |

---

## 🎨 Agregar un Nuevo Sistema

### 1. Edita `src/lib/brandConfig.ts`:
```typescript
'nuevo-sistema': {
  name: 'Mi Sistema',
  primaryColor: '#FF5733',
  redirectUrlAfterLogin: 'https://nuevo.midominio.com/auth/callback'
}
```

### 2. Agrega la URL a Supabase:
```env
GOTRUE_URI_ALLOW_LIST=...,https://nuevo.midominio.com/auth/callback
```

### 3. Prueba:
```
http://localhost:5173/?system=nuevo-sistema
```

---

## 🔧 Configuración de Supabase Auth

### Variables Requeridas:
```env
GOTRUE_URI_ALLOW_LIST=https://app1.com/auth/callback,https://app2.com/auth/callback
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=tu-client-id
GOTRUE_EXTERNAL_GOOGLE_SECRET=tu-secret
```

Ver `SUPABASE_CONFIG.md` para más detalles.

---

## 📁 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `src/lib/brandConfig.ts` | Configuración de sistemas |
| `src/lib/supabaseClient.ts` | Cliente de Supabase |
| `src/routes/+page.svelte` | Página de login |
| `src/routes/+error.svelte` | Página de error |
| `.env` | Variables de entorno |

---

## 🐛 Solución Rápida de Problemas

### Error: "Sistema no encontrado"
```
✓ Verifica que el parámetro ?system=... esté en la URL
✓ Confirma que el sistema exista en brandConfig.ts
```

### Error: "Invalid redirect URL"
```
✓ Agrega la URL a GOTRUE_URI_ALLOW_LIST en Supabase
✓ Verifica que no haya espacios extra
```

### Los colores no cambian
```
✓ Refresca con Ctrl+F5
✓ Verifica que el parámetro ?system=... sea válido
```

---

## 📚 Documentación Completa

- **README.md** - Documentación general del proyecto
- **DEVELOPMENT.md** - Guía detallada de desarrollo
- **SUPABASE_CONFIG.md** - Configuración de Supabase Auth
- **TESTING.md** - Guía de testing y verificación
- **CHILD_APP_EXAMPLE.ts** - Ejemplos para apps hijas

---

## 🚢 Deploy a Producción

### Vercel:
```bash
vercel
```

### Netlify:
1. Conecta tu repositorio
2. Build command: `npm run build`
3. Publish directory: `build`

No olvides configurar las variables de entorno en tu plataforma.

---

## 💡 Tips

- Usa modo incógnito para probar sin caché
- Revisa las DevTools Console para debugging
- Los cambios se aplican automáticamente en dev
- El color principal se actualiza dinámicamente

---

## 🆘 Ayuda

¿Problemas? Revisa:
1. **TESTING.md** - Checklist de verificación
2. **SUPABASE_CONFIG.md** - Configuración de Auth
3. **DEVELOPMENT.md** - Troubleshooting detallado

---

**¡Listo para empezar! 🎉**

Abre http://localhost:5173/?system=interpos y comienza a autenticar.
