# 🔧 Configuración de Desarrollo - InterAuth

## Problema con pnpm-lock.yaml

Si encuentras el error `ERR_PNPM_LOCKFILE_BREAKING_CHANGE` durante el build en Dokploy, significa que el `pnpm-lock.yaml` fue generado con una versión diferente de pnpm.

## Solución: Regenerar el lockfile

Ejecuta estos comandos en tu máquina local (en el directorio del proyecto):

```bash
# Habilitar corepack
corepack enable

# Preparar la versión específica de pnpm
corepack prepare pnpm@8.15.9 --activate

# Regenerar solo el lockfile (sin instalar dependencias)
pnpm install --lockfile-only
```

## Después de regenerar

```bash
# Agregar el lockfile actualizado
git add pnpm-lock.yaml

# Commit con mensaje descriptivo
git commit -m "fix: regenerate lockfile for pnpm 8.15.9"

# Push al repositorio
git push
```

## Verificación

Después del push, el build en Dokploy debería funcionar correctamente con `pnpm install --frozen-lockfile`.
