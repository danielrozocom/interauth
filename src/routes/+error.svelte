<script lang="ts">
  /**
   * Página de Error
   * 
   * Se muestra cuando hay un error (ej: sistema no encontrado o no especificado)
   */
  
  import { page } from '$app/stores';
</script>

<div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100">
  <div class="max-w-md w-full">
    <!-- Tarjeta de error -->
    <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
      <!-- Icono de error -->
      <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <!-- Título del error -->
      <h1 class="text-2xl font-bold text-gray-900 mb-3">
        {$page.status === 404 ? 'Sistema no encontrado' : 'Error de configuración'}
      </h1>

      <!-- Mensaje del error -->
      <p class="text-gray-600 mb-6">
        {$page.error?.message || 'Sistema no encontrado o no configurado. Verifica el enlace con tu administrador.'}
      </p>

      <!-- Información adicional -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <p class="text-sm text-gray-700 mb-2">
          <span class="font-semibold">¿Qué puedes hacer?</span>
        </p>
        <ul class="text-sm text-gray-600 text-left space-y-1">
          <li>• Verifica que la URL sea correcta</li>
          <li>• Asegúrate de incluir el parámetro <code class="bg-gray-200 px-1 rounded">?system=...</code></li>
          <li>• Contacta a tu administrador de sistemas</li>
        </ul>
      </div>

      <!-- Botón de ayuda -->
      <div class="pt-4 border-t border-gray-200">
        <p class="text-xs text-gray-500">
          Código de error: <span class="font-mono font-semibold">{$page.status}</span>
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  code {
    font-family: 'Courier New', monospace;
  }
</style>
