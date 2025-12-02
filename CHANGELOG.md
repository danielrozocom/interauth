# Changelog

Todos los cambios importantes de este proyecto serán documentados en este archivo.

## [1.0.0] - 2025-12-01

### ✨ Inicial Release

#### Agregado
- **Autenticación Multi-Sistema**: Soporte para múltiples aplicaciones con un solo intermediario
- **3 Sistemas Pre-configurados**:
  - InterPOS (azul #35528C)
  - Panel Administrativo (teal #008080)
  - Tienda Inter (rojo #A42323)
- **OAuth con Google**: Integración completa con Google como proveedor de autenticación
- **Colores Dinámicos**: Cada sistema tiene su propio color principal que se aplica automáticamente
- **Fuente Nunito**: Tipografía moderna desde Google Fonts
- **TypeScript**: Código completamente tipado
- **Tailwind CSS**: Framework de utilidades para estilos
- **SvelteKit**: Framework moderno de Svelte para aplicaciones web

#### Características
- Manejo de errores robusto para sistemas no configurados
- Validación de parámetro `system` en la URL
- Configuración centralizada de brands en `brandConfig.ts`
- Cliente de Supabase reutilizable
- Página de error amigable
- Variables CSS dinámicas para colores
- Responsive design
- SEO friendly

#### Documentación
- README.md completo con instrucciones de instalación
- DEVELOPMENT.md con guía de desarrollo
- SUPABASE_CONFIG.md para configuración de Auth
- TESTING.md con checklist de pruebas
- QUICKSTART.md para inicio rápido
- CHILD_APP_EXAMPLE.ts con ejemplos para aplicaciones hijas

#### Configuración
- Variables de entorno para Supabase
- Tailwind CSS configurado
- TypeScript configurado
- VSCode settings y extensiones recomendadas
- Git ignore configurado
- Favicon placeholder

#### Seguridad
- OAuth 2.0 con Google
- Validación de URLs de redirección
- Session management con Supabase
- Variables de entorno para credenciales sensibles

---

## Próximas Versiones (Roadmap)

### [1.1.0] - Planeado
- [ ] Soporte para más proveedores OAuth (GitHub, Microsoft, etc.)
- [ ] Página de recuperación de contraseña
- [ ] Página de registro manual (email/password)
- [ ] Temas claro/oscuro
- [ ] Internacionalización (i18n)

### [1.2.0] - Planeado
- [ ] Dashboard de administración
- [ ] Gestión de usuarios
- [ ] Logs de autenticación
- [ ] Analytics básicos

### [2.0.0] - Futuro
- [ ] Multi-tenancy
- [ ] SSO (Single Sign-On)
- [ ] 2FA (Two-Factor Authentication)
- [ ] Webhooks para eventos de auth

---

## Formato

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

### Tipos de Cambios
- **Agregado** - para nuevas funcionalidades
- **Cambiado** - para cambios en funcionalidades existentes
- **Deprecado** - para funcionalidades que serán removidas
- **Removido** - para funcionalidades removidas
- **Corregido** - para corrección de bugs
- **Seguridad** - para cambios de seguridad
