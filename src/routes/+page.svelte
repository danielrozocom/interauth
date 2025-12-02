<script lang="ts">
    /**
     * Página Principal - Login con Google OAuth
     *
     * Esta página muestra la interfaz de login con Google OAuth.
     * Utiliza el brand configurado para personalizar colores y redirección.
     */

    import { supabase } from "$lib/supabaseClient";
    import type { PageData } from "./$types";

    export let data: PageData;

    let isLoading = false;
    let errorMessage = "";

    /**
     * Maneja el inicio de sesión con Google OAuth
     */
    async function handleGoogleLogin() {
        try {
            isLoading = true;
            errorMessage = "";

            // Construir la URL de redirección usando la configuración del brand
            const redirectUrl = data.brandConfig.redirectUrlAfterLogin;

            // Iniciar el flujo de OAuth con Google
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: redirectUrl,
                },
            });

            if (error) {
                console.error("Error en OAuth:", error);
                errorMessage =
                    "Error al iniciar sesión con Google. Por favor, intenta nuevamente.";
                isLoading = false;
            }
            // Si no hay error, el usuario será redirigido automáticamente a Google
        } catch (err) {
            console.error("Error inesperado:", err);
            errorMessage =
                "Ocurrió un error inesperado. Por favor, intenta nuevamente.";
            isLoading = false;
        }
    }
</script>

<div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full">
        <!-- Tarjeta de login -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
            <!-- Logo o icono (opcional - puedes agregar un logo aquí) -->
            <div class="text-center mb-8">
                <div
                    class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style="background-color: var(--primary, #35528C);"
                >
                    <svg
                        class="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                </div>

                <!-- Título con el nombre del sistema -->
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    Bienvenido a {data.brandConfig.name}
                </h1>

                <!-- Subtítulo -->
                <p class="text-gray-600 text-sm">
                    Inicia sesión de forma segura con tu cuenta de Google
                </p>
            </div>

            <!-- Mensaje de error -->
            {#if errorMessage}
                <div
                    class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                    <p class="text-red-800 text-sm">{errorMessage}</p>
                </div>
            {/if}

            <!-- Botón de Google OAuth -->
            <button
                on:click={handleGoogleLogin}
                disabled={isLoading}
                class="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                style="background-color: var(--primary, #35528C);"
            >
                {#if isLoading}
                    <!-- Spinner de carga -->
                    <svg
                        class="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <span>Conectando...</span>
                {:else}
                    <!-- Logo de Google -->
                    <svg class="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    <span>Continuar con Google</span>
                {/if}
            </button>

            <!-- Información adicional -->
            <div class="mt-8 pt-6 border-t border-gray-200">
                <p class="text-xs text-gray-500 text-center">
                    Al continuar, aceptas que esta es una plataforma segura de
                    autenticación. Tus datos están protegidos.
                </p>
            </div>
        </div>

        <!-- Información del sistema (solo para desarrollo) -->
        <div class="mt-6 text-center">
            <p class="text-xs text-gray-400">
                Sistema: <span class="font-semibold">{data.system}</span>
            </p>
        </div>
    </div>
</div>

<style>
    /* Estilos adicionales si son necesarios */
</style>
