# Estructura del Proyecto InterAuth

```
InterAuth/
│
├── 📁 .vscode/                      # Configuración de VSCode
│   ├── extensions.json              # Extensiones recomendadas
│   └── settings.json                # Settings del editor
│
├── 📁 src/                          # Código fuente
│   ├── 📁 lib/                      # Bibliotecas y utilidades
│   │   ├── brandConfig.ts           # ⭐ Configuración de sistemas/brands
│   │   └── supabaseClient.ts        # ⭐ Cliente de Supabase
│   │
│   ├── 📁 routes/                   # Rutas de SvelteKit
│   │   ├── +layout.server.ts        # ⭐ Server-side: maneja parámetro system
│   │   ├── +layout.svelte           # ⭐ Layout raíz: colores dinámicos
│   │   ├── +page.svelte             # ⭐ Página principal: login con Google
│   │   └── +error.svelte            # ⭐ Página de error
│   │
│   ├── app.css                      # 🎨 Estilos globales + Tailwind
│   ├── app.d.ts                     # 📝 Definiciones TypeScript
│   └── app.html                     # 🌐 HTML base
│
├── 📁 static/                       # Archivos estáticos
│   └── favicon.svg                  # Icono del sitio
│
├── 📄 package.json                  # ⚙️ Dependencias y scripts
├── 📄 svelte.config.js              # ⚙️ Configuración SvelteKit
├── 📄 vite.config.ts                # ⚙️ Configuración Vite
├── 📄 tailwind.config.js            # 🎨 Configuración Tailwind
├── 📄 postcss.config.js             # 🎨 Configuración PostCSS
├── 📄 tsconfig.json                 # 📝 Configuración TypeScript
│
├── 📄 .env                          # 🔐 Variables de entorno (no subir a Git)
├── 📄 .env.example                  # 📋 Ejemplo de variables de entorno
├── 📄 .gitignore                    # 🚫 Archivos a ignorar en Git
│
├── 📚 README.md                     # 📖 Documentación principal
├── 📚 QUICKSTART.md                 # ⚡ Guía de inicio rápido
├── 📚 DEVELOPMENT.md                # 🔧 Guía de desarrollo
├── 📚 SUPABASE_CONFIG.md            # 🔒 Configuración de Supabase Auth
├── 📚 TESTING.md                    # ✅ Guía de testing
├── 📚 CHANGELOG.md                  # 📝 Registro de cambios
├── 📚 CHILD_APP_EXAMPLE.ts          # 💡 Ejemplos para apps hijas
└── 📚 PROJECT_STRUCTURE.md          # 📊 Este archivo
```

---

## 🎯 Archivos Clave

### ⭐ Archivos que Modificarás Frecuentemente

#### 1. `src/lib/brandConfig.ts`
**Propósito**: Define todos los sistemas (brands) disponibles.

```typescript
const BRAND_CONFIG = {
  'interpos': {
    name: 'InterPOS',
    primaryColor: '#35528C',
    redirectUrlAfterLogin: 'https://interpos.midominio.com/auth/callback'
  }
  // Agrega más sistemas aquí
};
```

**Cuándo modificar**:
- ✅ Agregar un nuevo sistema
- ✅ Cambiar el color de un sistema
- ✅ Cambiar la URL de redirección

---

#### 2. `src/routes/+page.svelte`
**Propósito**: Página principal con el botón de login.

```svelte
<button onclick={handleGoogleLogin}>
  Continuar con Google
</button>
```

**Cuándo modificar**:
- ✅ Cambiar textos de la UI
- ✅ Agregar/modificar estilos
- ✅ Agregar más opciones de login

---

#### 3. `.env`
**Propósito**: Variables de entorno para Supabase.

```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

**Cuándo modificar**:
- ✅ Cambiar instancia de Supabase
- ✅ Actualizar credenciales

---

### 🔧 Archivos de Configuración

#### `svelte.config.js`
Configuración de SvelteKit (adapter, preprocessors, etc.)

#### `vite.config.ts`
Configuración de Vite (plugins, build options, etc.)

#### `tailwind.config.js`
Configuración de Tailwind CSS (colores, fuentes, etc.)

#### `tsconfig.json`
Configuración de TypeScript (strict mode, paths, etc.)

---

### 📚 Documentación

| Archivo | Propósito | Para Quién |
|---------|-----------|------------|
| `README.md` | Documentación general | Todos |
| `QUICKSTART.md` | Inicio rápido (5 min) | Developers nuevos |
| `DEVELOPMENT.md` | Guía de desarrollo | Developers |
| `SUPABASE_CONFIG.md` | Config de Auth | DevOps/Backend |
| `TESTING.md` | Guía de pruebas | QA/Testers |
| `CHANGELOG.md` | Historial de cambios | Product Managers |
| `CHILD_APP_EXAMPLE.ts` | Ejemplos de integración | Frontend Devs |

---

## 🔄 Flujo de Datos

```
1. Usuario visita URL
   └─> http://localhost:5173/?system=interpos

2. +layout.server.ts (SERVER)
   ├─> Extrae parámetro "system"
   ├─> Valida que exista
   ├─> Resuelve brandConfig
   └─> Envía datos al cliente

3. +layout.svelte (CLIENT)
   ├─> Recibe brandConfig
   ├─> Aplica color principal (--primary)
   └─> Renderiza children

4. +page.svelte (CLIENT)
   ├─> Muestra UI de login
   ├─> Usuario click en "Continuar con Google"
   ├─> Llama a Supabase OAuth
   └─> Redirige a Google

5. Google Auth
   ├─> Usuario se autentica
   └─> Redirige a redirectUrlAfterLogin

6. Aplicación Hija
   └─> Recibe callback con código
       └─> Intercambia código por sesión
           └─> Usuario autenticado ✅
```

---

## 🎨 Personalización

### Cambiar Colores

**Globales** (Tailwind):
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'mi-color': '#FF5733'
    }
  }
}
```

**Por Sistema** (Brand):
```typescript
// src/lib/brandConfig.ts
'mi-sistema': {
  primaryColor: '#FF5733'
}
```

### Cambiar Fuente

**En Tailwind**:
```javascript
// tailwind.config.js
fontFamily: {
  sans: ['Mi Fuente', 'system-ui', 'sans-serif']
}
```

**En Layout**:
```svelte
<!-- src/routes/+layout.svelte -->
<link href="https://fonts.googleapis.com/css2?family=Mi+Fuente&display=swap" />
```

### Agregar Proveedor OAuth

**En Supabase**:
```env
GOTRUE_EXTERNAL_GITHUB_ENABLED=true
GOTRUE_EXTERNAL_GITHUB_CLIENT_ID=...
GOTRUE_EXTERNAL_GITHUB_SECRET=...
```

**En +page.svelte**:
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'github'  // Cambiar provider
});
```

---

## 📦 Dependencias Principales

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@sveltejs/kit` | ^2.0.0 | Framework SvelteKit |
| `svelte` | ^5.0.0 | Framework Svelte |
| `@supabase/supabase-js` | ^2.39.0 | Cliente de Supabase |
| `@supabase/auth-ui-svelte` | ^0.2.9 | UI components (opcional) |
| `tailwindcss` | ^3.4.0 | Framework CSS |
| `typescript` | ^5.0.0 | TypeScript |
| `vite` | ^5.0.0 | Build tool |

---

## 🚀 Scripts NPM

| Script | Comando | Propósito |
|--------|---------|-----------|
| `dev` | `vite dev` | Servidor de desarrollo |
| `build` | `vite build` | Build para producción |
| `preview` | `vite preview` | Preview del build |
| `check` | `svelte-check` | Type checking |

---

## 🔐 Variables de Entorno

| Variable | Requerida | Ejemplo |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | ✅ Sí | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ Sí | `eyJhbGci...` |

**Importante**: Las variables con prefijo `VITE_` son accesibles en el cliente.

---

## 🎯 Puntos de Entrada

### Para Usuarios
```
URL: https://auth.midominio.com/?system=NOMBRE
```

### Para Developers
```typescript
// src/lib/brandConfig.ts
export function resolveBrand(system: string): BrandConfig | null
```

### Para Apps Hijas
```
Callback: https://app.midominio.com/auth/callback?code=XXX
```

---

## ✅ Checklist de Setup

- [ ] `npm install` ejecutado
- [ ] `.env` creado con credenciales
- [ ] Supabase configurado con Google OAuth
- [ ] URLs en `GOTRUE_URI_ALLOW_LIST`
- [ ] `npm run dev` funciona
- [ ] Sistemas cargan correctamente
- [ ] Colores se aplican dinámicamente
- [ ] Fuente Nunito visible

---

**¿Listo?** 🎉 Abre `QUICKSTART.md` para comenzar.
