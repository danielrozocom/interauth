<script lang="ts">
  import { onMount } from "svelte";
  import type { PageData } from "./$types";

  export let data: PageData;

  onMount(() => {
    if (data.connected && data.redirectUrl) {
      // Redirección controlada por el cliente solo si fue exitoso
      // Usamos replace para no ensuciar el historial
      setTimeout(() => {
        window.location.replace(data.redirectUrl);
      }, 500); // Pequeño delay para UX (ver el check)
    }
  });
</script>

<div class="callback-page">
  <div class="card">
    {#if data.connected}
      <div class="icon success">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2>¡Verificado!</h2>
      <p>{data.message}</p>
      {#if data.isRecovery}
        <p class="subtext">Te estamos llevando a cambiar tu contraseña...</p>
      {:else}
        <p class="subtext">Redirigiendo a la aplicación...</p>
      {/if}
    {:else}
      <div class="icon error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2>Enlace no válido</h2>
      <p>{data.message}</p>
      <a href="/" class="btn">Volver al inicio</a>
    {/if}
  </div>
</div>

<style>
  .callback-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }
  .card {
    background: white;
    padding: 2.5rem;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    text-align: center;
    max-width: 400px;
    width: 90%;
    border: 1px solid #f0f0f0;
  }
  .icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
  }
  .success {
    color: #10b981;
  }
  .error {
    color: #ef4444;
  }
  h2 {
    margin: 0 0 0.5rem;
    color: #111827;
    font-size: 1.5rem;
  }
  p {
    color: #6b7280;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  .subtext {
    font-size: 0.9rem;
    color: #9ca3af;
  }
  .btn {
    display: inline-block;
    background: #35528c;
    color: white;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    transition: background 0.2s;
  }
  .btn:hover {
    background: #2a4170;
  }
</style>
