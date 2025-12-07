# 🔐 InterAuth - Intermediario de Autenticación

Sistema de autenticación centralizado usando **SvelteKit** y **Supabase Auth** (self-hosted).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.0+-orange.svg)](https://kit.svelte.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39+-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38B2AC.svg)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-8.0+-yellow.svg)](https://pnpm.io/)

---

## 🎯 Descripción

InterAuth es un intermediario de autenticación que permite a múltiples aplicaciones usar el mismo sistema de login con Supabase Auth. Cada sistema puede tener su propia personalización de marca (nombre, colores, URL de redirección).

### 🎬 Demo Visual

```
┌─────────────────────────────────────────────┐
│  🏢 Bienvenido a InterPOS                   │
│                                             │
│  Inicia sesión de forma segura con tu      │
│  cuenta de Google                           │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  🔵 Continuar con Google              │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 📚 Documentación Completa

| Documento                                        | Descripción                          | Para Quién               |
| ------------------------------------------------ | ------------------------------------ | ------------------------ |
| **[QUICKSTART.md](QUICKSTART.md)**               | ⚡ Inicio rápido (5 min)             | Todos                    |
| **[INSTALLATION.md](INSTALLATION.md)**           | 📦 Instalación detallada paso a paso | DevOps / Nuevos usuarios |
| **[DEVELOPMENT.md](DEVELOPMENT.md)**             | 🔧 Guía completa de desarrollo       | Developers               |
| **[SUPABASE_CONFIG.md](SUPABASE_CONFIG.md)**     | 🔒 Configuración de Supabase Auth    | Backend / DevOps         |
| **[EXAMPLES.md](EXAMPLES.md)**                   | 💡 Ejemplos prácticos de uso         | Developers               |
| **[TESTING.md](TESTING.md)**                     | ✅ Guía de testing y verificación    | QA / Testers             |
| **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** | 📊 Estructura del proyecto           | Todos                    |
| **[PNPM.md](PNPM.md)**                           | 📦 Guía de uso de pnpm               | Developers               |
| **[SUMMARY.md](SUMMARY.md)**                     | 🎯 Resumen ejecutivo                 | Product Managers         |
| **[CHILD_APP_EXAMPLE.ts](CHILD_APP_EXAMPLE.ts)** | 🔗 Integración con apps hijas        | Frontend Devs            |
| **[CHANGELOG.md](CHANGELOG.md)**                 | 📝 Historial de cambios              | Todos                    |

---

## ✨ Características

- **Multi-sistema**: Soporta múltiples aplicaciones con una sola instalación
- **Personalización por marca**: Cada sistema tiene su propio nombre, color y URL de redirección
- **OAuth con Google**: Login seguro usando Google como proveedor
- **Fuente Nunito**: Tipografía moderna y legible en toda la aplicación
- **Colores dinámicos**: Cada sistema usa su propio color principal
- **TypeScript**: Código completamente tipado para mayor seguridad

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd InterAuth
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
copy .env.example .env
```

Edita `.env` y configura tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=tu-supabase-anon-key
```

### 4. Configurar Supabase Auth

En tu instancia de Supabase (self-hosted), asegúrate de:

1. **Habilitar Google OAuth** en la configuración de Auth
2. **Agregar las URLs de redirección** a `GOTRUE_URI_ALLOW_LIST`:
   - `https://interpos.midominio.com/auth/callback`
   - `https://admin.midominio.com/auth/callback`
   - `https://tienda.midominio.com/auth/callback`

### 5. Ejecución y Despliegue

#### Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm dev
```

#### Producción Local

```bash
# Construir la aplicación
pnpm build

# Iniciar servidor de producción
pnpm start
```

#### Docker (Dokploy)

```bash
# Construir imagen
docker build -t interauth .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env interauth
```

## 🎨 Sistemas Configurados

El proyecto viene con 3 sistemas preconfigurados:

### InterPOS

- **URL**: `/?system=interpos`
- **Color**: `#35528C` (azul)
- **Redirect**: `https://interpos.midominio.com/auth/callback`

### Panel Administrativo

- **URL**: `/?system=admin`
- **Color**: `#008080` (teal)
- **Redirect**: `https://admin.midominio.com/auth/callback`

### Tienda Inter

- **URL**: `/?system=tienda`
- **Color**: `#A42323` (rojo)
- **Redirect**: `https://tienda.midominio.com/auth/callback`

## 🔧 Agregar un Nuevo Sistema

Para agregar un nuevo sistema, edita el archivo `src/lib/brandConfig.ts`:

```typescript
const BRAND_CONFIG: Record<string, BrandConfig> = {
  // ... sistemas existentes ...

  // Nuevo sistema
  "mi-nuevo-sistema": {
    name: "Mi Nuevo Sistema",
    primaryColor: "#FF5733",
    redirectUrlAfterLogin: "https://mi-sistema.midominio.com/auth/callback",
  },
};
```

**Importante**: No olvides agregar la URL de redirección a `GOTRUE_URI_ALLOW_LIST` en Supabase.

## 📁 Estructura del Proyecto

```
InterAuth/
├── src/
│   ├── lib/
│   │   ├── brandConfig.ts       # Configuración de sistemas/brands
│   │   └── supabaseClient.ts    # Cliente de Supabase
│   ├── routes/
│   │   ├── +layout.server.ts    # Lógica server-side (parámetro system)
│   │   ├── +layout.svelte       # Layout raíz (colores dinámicos)
│   │   ├── +page.svelte         # Página de login
│   │   └── +error.svelte        # Página de error
│   ├── app.css                  # Estilos globales con Tailwind
│   └── app.html                 # HTML base
├── .env.example                 # Variables de entorno de ejemplo
├── package.json                 # Dependencias
├── svelte.config.js             # Configuración de SvelteKit
├── tailwind.config.js           # Configuración de Tailwind
└── tsconfig.json                # Configuración de TypeScript
```

## 🌐 Uso

### URL de Login

Para que un usuario inicie sesión en un sistema específico, usa:

```
https://auth.midominio.com/?system=NOMBRE_SISTEMA
```

Ejemplo:

```
https://auth.midominio.com/?system=interpos
```

### Flujo de Autenticación

1. El usuario accede a la URL con el parámetro `?system=...`
2. La aplicación carga la configuración del sistema (nombre, color, redirect)
3. Se muestra la pantalla de login con el branding del sistema
4. El usuario hace clic en "Continuar con Google"
5. Supabase redirige a Google para autenticación
6. Después del login, Google redirige a la URL configurada del sistema

## 🎨 Personalización de Colores

Los colores se aplican dinámicamente usando variables CSS:

- El color principal se setea en `--primary`
- Los botones, enlaces y elementos destacados usan `var(--primary)`
- Cada sistema puede tener su propio color

## 🔒 Seguridad

- **OAuth 2.0**: Login seguro con Google
- **HTTPS requerido**: En producción, usa siempre HTTPS
- **URI Allow List**: Solo URLs autorizadas pueden recibir redirecciones
- **Session Management**: Supabase maneja automáticamente las sesiones

## 📦 Build para Producción

```bash
pnpm build
```

Los archivos compilados estarán en la carpeta `build/`.

## 🚢 Deploy

Puedes deployar a:

- **Vercel**: `npx vercel`
- **Netlify**: Conecta tu repositorio
- **Servidor propio**: Usa el adapter de Node.js

Recuerda configurar las variables de entorno en tu plataforma de deploy.

## 🐛 Troubleshooting

### Error: "Sistema no encontrado"

- Verifica que el parámetro `?system=...` esté en la URL
- Revisa que el sistema esté configurado en `src/lib/brandConfig.ts`

### Error al iniciar sesión con Google

- Confirma que Google OAuth esté habilitado en Supabase
- Verifica que las URLs de redirect estén en `GOTRUE_URI_ALLOW_LIST`
- Revisa las credenciales en `.env`

### Los colores no se aplican

- Asegúrate de que el navegador tenga JavaScript habilitado
- Verifica que el parámetro `?system=...` sea válido

## 📝 Licencia

Este proyecto es de uso interno.

## 👥 Soporte

Para soporte o preguntas, contacta al equipo de desarrollo.
