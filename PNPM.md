# 📦 Usando pnpm con InterAuth

Este proyecto está configurado para usar **pnpm** como gestor de paquetes.

## ¿Por qué pnpm?

- ⚡ **Más rápido**: Instala dependencias hasta 2x más rápido que npm
- 💾 **Ahorra espacio**: Usa un store global, no duplica paquetes
- 🔒 **Más seguro**: Strict mode por defecto
- 🎯 **Compatible**: Funciona con todos los proyectos npm

## Instalación de pnpm

Si aún no tienes pnpm instalado:

### Opción 1: Con npm (si ya lo tienes)
```powershell
npm install -g pnpm
```

### Opción 2: Con script de PowerShell
```powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

### Opción 3: Con Chocolatey
```powershell
choco install pnpm
```

### Verificar instalación
```powershell
pnpm --version
```

## Comandos Básicos

| Comando npm | Comando pnpm | Descripción |
|-------------|--------------|-------------|
| `npm install` | `pnpm install` | Instalar dependencias |
| `npm run dev` | `pnpm dev` | Iniciar desarrollo |
| `npm run build` | `pnpm build` | Build para producción |
| `npm run preview` | `pnpm preview` | Preview del build |
| `npm install <pkg>` | `pnpm add <pkg>` | Agregar dependencia |
| `npm uninstall <pkg>` | `pnpm remove <pkg>` | Remover dependencia |
| `npm update` | `pnpm update` | Actualizar dependencias |

## Uso en InterAuth

### 1. Instalar dependencias
```powershell
cd "C:\Users\Daniel Rozo\Documents\InterAuth"
pnpm install
```

### 2. Iniciar servidor de desarrollo
```powershell
pnpm dev
```

### 3. Build para producción
```powershell
pnpm build
```

### 4. Preview del build
```powershell
pnpm preview
```

## Configuración

El proyecto incluye un archivo `.npmrc` con configuración optimizada:

```ini
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
```

## Gestión de Dependencias

### Agregar dependencia
```powershell
pnpm add nombre-paquete
```

### Agregar dependencia de desarrollo
```powershell
pnpm add -D nombre-paquete
```

### Remover dependencia
```powershell
pnpm remove nombre-paquete
```

### Actualizar todas las dependencias
```powershell
pnpm update
```

### Actualizar a última versión
```powershell
pnpm up --latest
```

## Limpieza y Mantenimiento

### Limpiar node_modules y reinstalar
```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

### Limpiar caché de pnpm
```powershell
pnpm store prune
```

### Ver paquetes instalados
```powershell
pnpm list
```

### Ver paquetes obsoletos
```powershell
pnpm outdated
```

## Archivos Generados

- `pnpm-lock.yaml` - Lock file (SÍ subir a Git)
- `node_modules/` - Dependencias (NO subir a Git)
- `.pnpm-store/` - Store local de pnpm (NO subir a Git)

## Troubleshooting

### Error: "Cannot find module"
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item pnpm-lock.yaml
pnpm install
```

### Error: "ENOENT: no such file or directory"
```powershell
pnpm store prune
pnpm install
```

### Error: "Peer dependency"
El archivo `.npmrc` ya está configurado con `auto-install-peers=true`.

Si aún tienes problemas:
```powershell
pnpm install --shamefully-hoist
```

### Limpiar todo y empezar de cero
```powershell
Remove-Item -Recurse -Force node_modules, .pnpm-store
Remove-Item pnpm-lock.yaml
pnpm store prune
pnpm install
```

## Ventajas de pnpm en este Proyecto

### 1. Velocidad
Primera instalación:
- npm: ~60 segundos
- **pnpm: ~30 segundos** ⚡

Instalaciones subsecuentes:
- npm: ~45 segundos
- **pnpm: ~10 segundos** 🚀

### 2. Espacio en Disco
Con npm (3 proyectos similares):
- ~450 MB en node_modules

Con pnpm (3 proyectos similares):
- ~150 MB en node_modules
- ~100 MB en .pnpm-store (compartido)
- **Total: ~250 MB** (ahorro de ~200 MB) 💾

### 3. Consistencia
- Lock file más estricto
- Menos problemas de "works on my machine"
- Mejor para trabajo en equipo

## Migración desde npm

Si ya instalaste con npm:

```powershell
# 1. Eliminar archivos de npm
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 2. Instalar con pnpm
pnpm install
```

## Comandos Útiles

### Ver espacio usado
```powershell
pnpm store path
pnpm store status
```

### Verificar integridad
```powershell
pnpm audit
```

### Corregir vulnerabilidades
```powershell
pnpm audit --fix
```

### Ejecutar scripts
```powershell
pnpm dev              # Igual a: pnpm run dev
pnpm build            # Igual a: pnpm run build
pnpm preview          # Igual a: pnpm run preview
pnpm check            # Igual a: pnpm run check
```

## Recursos

- **Documentación oficial**: https://pnpm.io/
- **Migrar desde npm**: https://pnpm.io/npmrc
- **CLI Reference**: https://pnpm.io/cli/add

## FAQs

### ¿Es compatible con npm?
Sí, 100%. Usa el mismo `package.json` y registry.

### ¿Puedo usar npm y pnpm en el mismo proyecto?
Sí, pero no es recomendado. Elige uno y mantente con él.

### ¿El lock file es compatible?
No, `pnpm-lock.yaml` es diferente de `package-lock.json`.

### ¿Funciona con CI/CD?
Sí, soportado en GitHub Actions, GitLab CI, etc.

```yaml
# Ejemplo GitHub Actions
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8

- name: Install dependencies
  run: pnpm install
```

---

**¡Disfruta de instalaciones más rápidas con pnpm!** ⚡
