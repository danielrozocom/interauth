param(
    [switch]$RemoveStore
)

# Script to clean node_modules and pnpm lockfile, prune store, reinstall and build
Set-Location $PSScriptRoot\..  

Write-Host "Working directory: $(Get-Location)"

if (Test-Path './node_modules') {
    Write-Host "Removing node_modules..."
    Remove-Item -Recurse -Force './node_modules'
} else {
    Write-Host "No node_modules folder found."
}

if (Test-Path './pnpm-lock.yaml') {
    Write-Host "Removing pnpm-lock.yaml..."
    Remove-Item -Force './pnpm-lock.yaml'
} else {
    Write-Host "No pnpm-lock.yaml found."
}

Write-Host "pnpm store path:"; pnpm store path

Write-Host "Pruning pnpm store (removes unreferenced packages)..."
pnpm store prune

if ($RemoveStore) {
    $store = Join-Path $env:USERPROFILE '.pnpm-store'
    if (Test-Path $store) {
        Write-Host "Removing entire pnpm store at $store (this can be large)..."
        Remove-Item -Recurse -Force $store
    } else {
        Write-Host "No pnpm store found at $store"
    }
} else {
    Write-Host "Skipping full store removal. To remove the full store re-run with -RemoveStore flag."
}

Write-Host "Installing dependencies and regenerating pnpm-lock.yaml..."
pnpm install

Write-Host "Running build..."
pnpm run build

Write-Host "Done. If everything succeeded, commit the new pnpm-lock.yaml to the repo before deploying."
