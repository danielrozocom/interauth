# Testing Guide - InterAuth

## Pruebas Manuales

### 1. Verificar Sistemas Configurados

#### InterPOS (azul #35528C)
```
http://localhost:5173/?system=interpos
```
- ✓ Debe mostrar "Bienvenido a InterPOS"
- ✓ El botón debe ser azul (#35528C)
- ✓ La fuente debe ser Nunito

#### Panel Administrativo (teal #008080)
```
http://localhost:5173/?system=admin
```
- ✓ Debe mostrar "Bienvenido a Panel Administrativo"
- ✓ El botón debe ser teal (#008080)
- ✓ La fuente debe ser Nunito

#### Tienda Inter (rojo #A42323)
```
http://localhost:5173/?system=tienda
```
- ✓ Debe mostrar "Bienvenido a Tienda Inter"
- ✓ El botón debe ser rojo (#A42323)
- ✓ La fuente debe ser Nunito

### 2. Verificar Manejo de Errores

#### Sin parámetro system
```
http://localhost:5173/
```
- ✓ Debe mostrar página de error
- ✓ Debe indicar que el parámetro system es requerido
- ✓ No debe mostrar botón de login

#### Sistema inválido
```
http://localhost:5173/?system=inexistente
```
- ✓ Debe mostrar página de error
- ✓ Debe indicar que el sistema no está configurado
- ✓ No debe mostrar botón de login

### 3. Verificar Colores Dinámicos

Abre las DevTools del navegador y verifica:

```javascript
// En la consola del navegador
getComputedStyle(document.documentElement).getPropertyValue('--primary')
```

- Para `interpos`: debe retornar `#35528C`
- Para `admin`: debe retornar `#008080`
- Para `tienda`: debe retornar `#A42323`

### 4. Verificar Fuente Nunito

En las DevTools, inspecciona cualquier texto:

- ✓ `font-family` debe incluir "Nunito"
- ✓ La fuente debe cargarse desde Google Fonts

### 5. Prueba de OAuth (requiere Supabase configurado)

1. Configura Supabase con Google OAuth
2. Visita: `http://localhost:5173/?system=interpos`
3. Click en "Continuar con Google"
4. Debe redirigir a la página de login de Google
5. Después del login, debe redirigir a la URL configurada

## Checklist de Configuración

Antes de probar OAuth, verifica:

- [ ] Variables de entorno en `.env`
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  
- [ ] Supabase Auth configurado
  - [ ] Google OAuth habilitado
  - [ ] `GOTRUE_EXTERNAL_GOOGLE_ENABLED=true`
  - [ ] `GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID` configurado
  - [ ] `GOTRUE_EXTERNAL_GOOGLE_SECRET` configurado
  
- [ ] URLs de callback permitidas
  - [ ] `https://interpos.midominio.com/auth/callback`
  - [ ] `https://admin.midominio.com/auth/callback`
  - [ ] `https://tienda.midominio.com/auth/callback`
  - [ ] Agregadas a `GOTRUE_URI_ALLOW_LIST`

## Tests Automáticos (opcional)

Si quieres agregar tests automáticos, instala:

```bash
npm install -D @playwright/test
```

Ejemplo de test:

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test';

test('debe cargar InterPOS correctamente', async ({ page }) => {
  await page.goto('/?system=interpos');
  await expect(page.locator('h1')).toContainText('InterPOS');
});

test('debe mostrar error sin system param', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Error');
});
```

## Debugging

### Ver logs de Supabase

```javascript
// En supabaseClient.ts, agrega:
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(url, key, {
  auth: {
    debug: true  // Habilita logs detallados
  }
});
```

### Ver requests de red

Abre las DevTools → Network tab:
- Filtra por "auth"
- Verifica las requests a Supabase
- Revisa los códigos de respuesta (200, 400, etc.)

### Verificar cookies

DevTools → Application → Cookies:
- Debe existir una cookie de Supabase después del login
- La cookie debe contener el token de sesión

## Errores Comunes

### "Failed to load resource: net::ERR_CONNECTION_REFUSED"
- Verifica que Supabase esté corriendo
- Revisa `VITE_SUPABASE_URL` en `.env`

### "Invalid redirect URL"
- Verifica `GOTRUE_URI_ALLOW_LIST`
- Asegúrate de que la URL esté permitida

### "Google OAuth not configured"
- Verifica las variables `GOTRUE_EXTERNAL_GOOGLE_*`
- Confirma que Google OAuth esté habilitado

### Los colores no cambian
- Verifica que el parámetro `?system=...` esté en la URL
- Abre DevTools y verifica la variable CSS `--primary`
- Refresca la página (Ctrl+F5)

## Performance

Verifica el rendimiento:

```bash
npm run build
npm run preview
```

Abre DevTools → Lighthouse:
- Performance debe ser > 90
- Accessibility debe ser > 90
- Best Practices debe ser > 90
- SEO debe ser > 80

## Conclusión

Marca cada test como completado:

- [ ] Todos los sistemas cargan correctamente
- [ ] Los colores se aplican dinámicamente
- [ ] La fuente Nunito se carga correctamente
- [ ] Los errores se manejan apropiadamente
- [ ] OAuth con Google funciona (si está configurado)
