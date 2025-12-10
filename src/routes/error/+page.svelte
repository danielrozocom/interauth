<script lang="ts">
  import { page } from "$app/stores";

  // Obtener parámetros de error de la URL
  const errorCode = $page.url.searchParams.get("error");
  const errorDescription = $page.url.searchParams.get("description");
  const system = $page.url.searchParams.get("system");

  // Mensajes más amigables según el tipo de error
  const getErrorMessage = (code: string | null) => {
    switch (code) {
      case "oauth_failed":
        return "Error en la autenticación OAuth";
      case "invalid_code":
        return "Código de autenticación inválido";
      case "token_expired":
        return "El enlace ha expirado";
      default:
        return "Error de autenticación";
    }
  };

  const getErrorHint = (code: string | null) => {
    switch (code) {
      case "oauth_failed":
        return "Ocurrió un problema al procesar tu autenticación. Intenta de nuevo.";
      case "invalid_code":
        return "El código de autenticación no es válido. Solicita uno nuevo.";
      case "token_expired":
        return "Tu enlace ha expirado. Por favor, solicita uno nuevo.";
      default:
        return "Hubo un problema procesando tu solicitud.";
    }
  };

  const handleRetry = () => {
    // Redirigir al inicio o a la página de login según el sistema
    const baseUrl = system ? `/?system=${system}` : "/";
    window.location.href = baseUrl;
  };
</script>

<div class="error-page">
  <div class="card">
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

    <h2>{getErrorMessage(errorCode)}</h2>
    <p class="main-message">{getErrorHint(errorCode)}</p>

    {#if errorDescription}
      <div class="error-details">
        <p class="label">Detalles técnicos:</p>
        <p class="description">{errorDescription}</p>
      </div>
    {/if}

    <div class="actions">
      <button class="btn btn-primary" on:click={handleRetry}>
        Intentar de nuevo
      </button>
      <a href="/" class="btn btn-secondary">Volver al inicio</a>
    </div>
  </div>
</div>

<style>
  .error-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 1rem;
  }

  .card {
    background: white;
    padding: 2.5rem;
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 500px;
    width: 100%;
    border: 1px solid #f0f0f0;
  }

  .icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon.error {
    color: #ef4444;
  }

  h2 {
    margin: 0 0 0.75rem;
    color: #111827;
    font-size: 1.5rem;
  }

  .main-message {
    color: #6b7280;
    font-size: 1rem;
    line-height: 1.6;
    margin: 0 0 1.5rem;
  }

  .error-details {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 1rem;
    margin: 1.5rem 0;
    text-align: left;
  }

  .error-details .label {
    color: #991b1b;
    font-weight: 600;
    font-size: 0.875rem;
    margin: 0 0 0.5rem;
  }

  .error-details .description {
    color: #7f1d1d;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    margin: 0;
    word-break: break-word;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    transition: all 0.3s ease;
    font-size: 1rem;
    flex: 1;
    min-width: 150px;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
  }

  .btn-secondary {
    background: #e5e7eb;
    color: #111827;
  }

  .btn-secondary:hover {
    background: #d1d5db;
  }

  @media (max-width: 640px) {
    .card {
      padding: 1.5rem;
    }

    .actions {
      flex-direction: column;
    }

    .btn {
      flex: 1;
    }
  }
</style>
