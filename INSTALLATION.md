# 📦 Instalación Completa - InterAuth

Esta guía te llevará paso a paso por la instalación y configuración completa de InterAuth.

---

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de tener instalado:

- ✅ **Node.js** (versión 18 o superior)
  - Verifica: `node --version`
  - Descarga: https://nodejs.org/

- ✅ **npm** (incluido con Node.js)
  - Verifica: `npm --version`

- ✅ **Git** (opcional, para control de versiones)
  - Verifica: `git --version`
  - Descarga: https://git-scm.com/

- ✅ **Supabase** (self-hosted o en la nube)
  - Necesitas: URL y Anon Key
  - Documentación: https://supabase.com/docs

---

## 🚀 Instalación Paso a Paso

### PASO 1: Navegar al Proyecto

Abre una terminal PowerShell y navega al directorio:

```powershell
cd "C:\Users\Daniel Rozo\Documents\InterAuth"
```

### PASO 2: Instalar Dependencias

Ejecuta el siguiente comando:

```powershell
pnpm install
```

**Tiempo estimado**: 1-2 minutos

**Qué hace**:
- Descarga todas las dependencias necesarias
- Crea la carpeta `node_modules` o usa el store de pnpm
- Genera `pnpm-lock.yaml`

**Salida esperada**:
```
added 350 packages, and audited 351 packages in 45s
```

### PASO 3: Configurar Variables de Entorno

#### 3.1 Copiar archivo de ejemplo

```powershell
copy .env.example .env
```

#### 3.2 Editar `.env`

Abre `.env` en tu editor favorito y reemplaza los valores:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**¿Dónde obtengo estas credenciales?**

1. Ve a tu proyecto en Supabase Dashboard
2. Settings → API
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### PASO 4: Configurar Supabase Auth

En tu dashboard de Supabase:

#### 4.1 Habilitar Google OAuth

1. Ve a **Authentication → Providers**
2. Encuentra **Google**
3. Click en **Enable**
4. Completa:
   - **Client ID** (de Google Cloud Console)
   - **Client Secret** (de Google Cloud Console)
5. Click **Save**

#### 4.2 Configurar Redirect URLs

1. Ve a **Authentication → URL Configuration**
2. En **Redirect URLs**, agrega:
   ```
   https://interpos.midominio.com/auth/callback
   https://admin.midominio.com/auth/callback
   https://tienda.midominio.com/auth/callback
   ```
3. Click **Save**

**Nota**: Para desarrollo local, también agrega:
```
http://localhost:3000/auth/callback
```

### PASO 5: Iniciar Servidor de Desarrollo

```powershell
pnpm dev
```

**Salida esperada**:
```
VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### PASO 6: Verificar Instalación

Abre tu navegador en:

#### Test 1: InterPOS
```
http://localhost:5173/?system=interpos
```

✅ **Debe mostrar**:
- Título: "Bienvenido a InterPOS"
- Botón azul (#35528C)
- Fuente Nunito

#### Test 2: Admin
```
http://localhost:5173/?system=admin
```

✅ **Debe mostrar**:
- Título: "Bienvenido a Panel Administrativo"
- Botón teal (#008080)
- Fuente Nunito

#### Test 3: Tienda
```
http://localhost:5173/?system=tienda
```

✅ **Debe mostrar**:
- Título: "Bienvenido a Tienda Inter"
- Botón rojo (#A42323)
- Fuente Nunito

#### Test 4: Error (sin system)
```
http://localhost:5173/
```

✅ **Debe mostrar**:
- Página de error
- Mensaje: "Sistema no especificado"

---

## 🔧 Configuración Avanzada (Opcional)

### Cambiar Puerto de Desarrollo

Ejecuta con el flag --port:

```powershell
pnpm dev --port 3000
```

O edita `package.json`:

```json
{
  "scripts": {
    "dev": "vite dev --port 3000"
  }
}
```

### Configurar VSCode

Instala las extensiones recomendadas:

1. Abre VSCode
2. Presiona `Ctrl+Shift+P`
3. Escribe: "Extensions: Show Recommended Extensions"
4. Instala todas las recomendadas

### Habilitar Debug Logs

Edita `src/lib/supabaseClient.ts`:

```typescript
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    debug: true  // 👈 Agrega esta línea
  }
});
```

---

## 📊 Verificación de Instalación

### Checklist Completo

- [ ] ✅ Node.js instalado (v18+)
- [ ] ✅ `npm install` completado sin errores
- [ ] ✅ `.env` creado con credenciales válidas
- [ ] ✅ Supabase configurado con Google OAuth
- [ ] ✅ Redirect URLs agregadas en Supabase
- [ ] ✅ `npm run dev` inicia sin errores
- [ ] ✅ http://localhost:5173/?system=interpos carga correctamente
- [ ] ✅ Colores se aplican dinámicamente
- [ ] ✅ Fuente Nunito se carga correctamente
- [ ] ✅ Página de error funciona (sin ?system=)

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"

```powershell
# Elimina node_modules y reinstala
Remove-Item -Recurse -Force node_modules
Remove-Item pnpm-lock.yaml
pnpm install
```

### Error: "Port 5173 is already in use"

```powershell
# Cambia el puerto
pnpm dev --port 3000
```

### Error: "VITE_SUPABASE_URL is not defined"

1. Verifica que `.env` existe
2. Verifica que las variables empiezan con `VITE_`
3. Reinicia el servidor: `Ctrl+C` y `pnpm dev`

### Error: "Failed to fetch"

1. Verifica que Supabase esté corriendo
2. Verifica que la URL en `.env` sea correcta
3. Verifica tu conexión a internet

### Los colores no cambian

1. Refresca con `Ctrl+F5` (hard refresh)
2. Verifica que el parámetro `?system=...` esté en la URL
3. Abre DevTools (F12) y verifica errores en Console

### Google OAuth no funciona

1. Verifica que Google OAuth esté habilitado en Supabase
2. Verifica que Client ID y Secret sean correctos
3. Verifica que las Redirect URLs estén configuradas
4. Revisa los logs de Supabase para más detalles

---

## 📚 Siguientes Pasos

### 1. Personalizar Sistemas

Lee: `DEVELOPMENT.md` → "Agregar un Nuevo Sistema"

### 2. Configurar Apps Hijas

Lee: `CHILD_APP_EXAMPLE.ts`

### 3. Deploy a Producción

Lee: `README.md` → "Deploy"

### 4. Testing Completo

Lee: `TESTING.md`

---

## 🆘 ¿Necesitas Ayuda?

### Recursos Disponibles

- 📖 **README.md** - Documentación general
- ⚡ **QUICKSTART.md** - Inicio rápido (5 min)
- 🔧 **DEVELOPMENT.md** - Guía de desarrollo
- 🔒 **SUPABASE_CONFIG.md** - Configuración de Auth
- ✅ **TESTING.md** - Guía de testing
- 📊 **PROJECT_STRUCTURE.md** - Estructura del proyecto

### Comandos Útiles

```powershell
# Ver versión de Node
node --version

# Ver versión de pnpm
pnpm --version

# Limpiar caché de pnpm
pnpm store prune

# Ver paquetes instalados
pnpm list --depth=0

# Actualizar dependencias
pnpm update

# Verificar tipos TypeScript
pnpm check

# Build para producción
pnpm build

# Preview del build
pnpm preview
```

---

## ✅ Instalación Completada

Si llegaste hasta aquí y todos los tests pasaron, ¡felicidades! 🎉

InterAuth está instalado y funcionando correctamente.

**Próximos pasos recomendados**:

1. ✨ Lee `QUICKSTART.md` para uso rápido
2. 🔧 Personaliza los sistemas en `src/lib/brandConfig.ts`
3. 🚀 Deploy a producción cuando estés listo

---

**¡Bienvenido a InterAuth!** 🚀

Para soporte, revisa la documentación o contacta al equipo de desarrollo.
