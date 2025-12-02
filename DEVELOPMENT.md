# Guía de Desarrollo

## Comandos Disponibles

### Desarrollo
```bash
pnpm dev
```
Inicia el servidor de desarrollo en `http://localhost:5173`

### Build
```bash
pnpm build
```
Compila la aplicación para producción

### Preview
```bash
pnpm preview
```
Previsualiza la aplicación compilada

### Type Check
```bash
pnpm check
```
Verifica los tipos de TypeScript

## Estructura de Archivos

### `/src/lib/`
Contiene código reutilizable y configuración:
- `brandConfig.ts`: Configuración de sistemas/brands
- `supabaseClient.ts`: Cliente de Supabase

### `/src/routes/`
Rutas de la aplicación:
- `+layout.server.ts`: Lógica server-side
- `+layout.svelte`: Layout raíz
- `+page.svelte`: Página principal (login)
- `+error.svelte`: Página de error

## Agregar un Nuevo Sistema

1. **Edita `src/lib/brandConfig.ts`:**
```typescript
const BRAND_CONFIG: Record<string, BrandConfig> = {
  // ... sistemas existentes ...
  
  'nuevo-sistema': {
    name: 'Nuevo Sistema',
    primaryColor: '#FF5733',
    redirectUrlAfterLogin: 'https://nuevo.midominio.com/auth/callback'
  }
};
```

2. **Agrega la URL a Supabase `GOTRUE_URI_ALLOW_LIST`:**
```env
GOTRUE_URI_ALLOW_LIST=...,https://nuevo.midominio.com/auth/callback
```

3. **Prueba el nuevo sistema:**
```
http://localhost:5173/?system=nuevo-sistema
```

## Cambiar Colores

Los colores se definen por sistema en `src/lib/brandConfig.ts`:

```typescript
primaryColor: '#FF5733'  // Formato hex
```

El color se aplica automáticamente a:
- Botón de login
- Enlaces
- Elementos destacados

## Personalizar la UI

### Modificar el Logo
Edita `src/routes/+page.svelte` y reemplaza el SVG del icono:

```svelte
<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
  <!-- Aquí puedes poner tu logo -->
  <img src="/logo.png" alt="Logo" />
</div>
```

### Cambiar Textos
Edita `src/routes/+page.svelte`:

```svelte
<h1 class="text-3xl font-bold text-gray-900 mb-2">
  Bienvenido a {data.brandConfig.name}
</h1>
```

### Modificar Estilos
Los estilos globales están en `src/app.css`. Para Tailwind, edita `tailwind.config.js`.

## Testing

### Probar Sistemas Existentes

```bash
# InterPOS
http://localhost:5173/?system=interpos

# Admin
http://localhost:5173/?system=admin

# Tienda
http://localhost:5173/?system=tienda
```

### Probar Errores

```bash
# Sin parámetro system
http://localhost:5173/

# Sistema inválido
http://localhost:5173/?system=invalido
```

## Deploy

### Vercel

```bash
npm install -g vercel
vercel
```

Configura las variables de entorno en el dashboard de Vercel.

### Netlify

1. Conecta tu repositorio
2. Build command: `npm run build`
3. Publish directory: `build`
4. Agrega las variables de entorno

### Docker (self-hosted)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "build"]
```

## Variables de Entorno

Crea un archivo `.env` con:

```env
VITE_SUPABASE_URL=https://tu-supabase-url
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

**Importante**: Nunca subas `.env` a Git.

## Tips de Desarrollo

1. **Hot Reload**: Los cambios se reflejan automáticamente en desarrollo
2. **TypeScript**: Usa `npm run check` para verificar tipos
3. **Console Logs**: Revisa la consola del navegador para debugging
4. **Supabase Logs**: Revisa los logs de Supabase para errores de auth

## Solución de Problemas Comunes

### Puerto 5173 ocupado
```bash
# Cambia el puerto en package.json
"dev": "vite dev --port 3000"
```

### Error de dependencias
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### TypeScript errors
```bash
pnpm check
```

### Build falla
```bash
# Limpia y rebuild
rm -rf .svelte-kit build
npm run build
```
