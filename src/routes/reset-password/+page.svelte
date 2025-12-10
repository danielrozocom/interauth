<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import PasswordInput from "$lib/components/PasswordInput.svelte";

  export let data: PageData;
  export let form: ActionData;

  let password = "";
  let confirmPassword = "";
  let clientError = "";
  let isSubmitting = false;
  let isSuccess = false;

  // Combine errors from server load, server action, or client validation
  $: error = form?.error || data.error || clientError;
  $: valid = data.valid;

  function goToLogin() {
    window.location.href = "/";
  }
</script>

<svelte:head>
  <title
    >Nueva Contraseña{data.brandConfig?.name
      ? ` | ${data.brandConfig.name}`
      : ""}</title
  >
</svelte:head>

<div class="login-page">
  <div class="card">
    <div
      class="brand"
      style:--primary-color={data.brandConfig?.primaryColor || "#35528c"}
    >
      {#if data.brandConfig?.name}<h1>{data.brandConfig.name}</h1>{:else}<h1>
          InterAuth
        </h1>{/if}
    </div>
    <div class="card-body">
      {#if !valid}
        <!-- Error state: invalid or expired link -->
        <div class="error-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            width="80"
            height="80"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2>Enlace no válido</h2>
        <div class="form-group">
          <p>{error}</p>
          <button on:click={goToLogin} class="login-btn"
            >Volver al inicio</button
          >
        </div>
      {:else if isSuccess}
        <!-- Success state -->
        <div class="success-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            width="80"
            height="80"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2>¡Listo!</h2>
        <div class="form-group">
          <p>
            Tu contraseña se actualizó correctamente.<br />
            Redirigiendo...
          </p>
          <div class="spinner-container">
            <span class="spinner-large"></span>
          </div>
        </div>
      {:else}
        <!-- Password reset form -->
        <h2>Nueva Contraseña</h2>
        <p>Crea una nueva contraseña segura para tu cuenta.</p>
        {#if data.userEmail}
          <p class="user-email"><strong>{data.userEmail}</strong></p>
        {/if}

        <img src="/favicon.svg" alt="Logo" class="top-logo" />

        <form
          method="POST"
          use:enhance={({ cancel }) => {
            clientError = "";
            if (password.length < 6) {
              clientError = "La contraseña debe tener al menos 6 caracteres.";
              cancel();
              return;
            }
            if (password !== confirmPassword) {
              clientError = "Las contraseñas no coinciden.";
              cancel();
              return;
            }
            isSubmitting = true;
            return async ({ update, result }) => {
              if (result.type === "failure") {
                isSubmitting = false;
              } else if (result.type === "success" && result.data?.success) {
                isSuccess = true;
                setTimeout(() => {
                  window.location.href = result.data.redirectTo;
                }, 2000);
              }
              await update();
            };
          }}
          class="form-group"
        >
          <input type="hidden" name="system" value={data.system ?? ""} />
          <input
            type="hidden"
            name="redirect_to"
            value={data.redirectTo ?? ""}
          />

          <PasswordInput
            name="password"
            bind:value={password}
            placeholder="Nueva contraseña"
            disabled={isSubmitting}
          />
          <PasswordInput
            name="confirmPassword"
            bind:value={confirmPassword}
            placeholder="Confirmar contraseña"
            disabled={isSubmitting}
          />

          <button
            type="submit"
            class="login-btn mb-2"
            disabled={isSubmitting || !password || password.length < 6}
            style:--primary-color={data.brandConfig?.primaryColor || "#35528c"}
          >
            {#if isSubmitting}
              <span class="spinner"></span>
            {:else}
              Actualizar contraseña
            {/if}
          </button>

          {#if error}
            <div class="error-message">
              {error}
            </div>
          {/if}

          <button type="button" class="link-btn" on:click={goToLogin}>
            Volver al login
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>

<style>
  :global {
    :root {
      --primary-color: #35528c;
    }
  }
  .login-page {
    display: flex;
    min-height: calc(100vh - var(--topbar-h, 64px));
    align-items: center;
    justify-content: center;
    overflow: visible;
    padding: 2rem 0;
  }
  .card {
    background: linear-gradient(180deg, #ffffff, #fbfdff);
    padding: 0;
    border-radius: 16px;
    border: 1px solid rgba(2, 6, 23, 0.06);
    box-shadow: 0 12px 30px rgba(2, 6, 23, 0.06);
    width: 360px;
    max-width: min(420px, 92%);
    overflow: hidden;
    max-height: none;
    position: relative;
    margin: 2rem auto;
  }
  @media (max-height: 700px) {
    .login-page {
      align-items: flex-start;
      padding-top: 2.5rem;
      padding-bottom: 2.5rem;
    }
    .card {
      margin-top: 1.5rem;
      margin-bottom: 1.5rem;
    }
  }
  @media (min-width: 1000px) {
    .card {
      width: 560px;
      border-radius: 16px;
      box-shadow: 0 14px 34px rgba(2, 6, 23, 0.05);
      max-height: none;
    }
    .card-body {
      padding: 1.25rem 1.5rem;
      overflow: visible;
    }
    .top-logo {
      width: 110px;
    }
  }
  .brand {
    background: var(--primary-color, #35528c);
    color: #fff;
    padding: 0.9rem 1rem;
    text-align: center;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
  }
  .brand h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: 0.4px;
  }
  .card-body {
    padding: 1rem 1.25rem;
    overflow: visible;
    max-height: none;
  }
  .card h2 {
    font-size: clamp(1.8rem, 3.5vw, 2.2rem);
    font-weight: 800;
    margin: 0.25rem 0 1rem 0;
    text-align: center;
    color: #111827;
  }
  .card p {
    margin-bottom: 1rem;
    text-align: center;
  }
  .user-email {
    margin-bottom: 0.5rem !important;
    color: #374151;
  }
  .top-logo {
    display: block;
    margin: 0.5rem auto 1rem auto;
    width: 96px;
    height: auto;
    max-height: 96px;
    object-fit: contain;
  }
  @media (max-height: 700px), (max-width: 420px) {
    .card {
      overflow: visible;
      margin: 0 12px;
      width: calc(100% - 24px);
      border-radius: 12px;
    }
    .card-body {
      padding: 1rem;
    }
    .top-logo {
      width: 100px;
      max-height: 100px;
      margin-bottom: 1.2rem;
    }
  }
  .login-btn {
    width: 100%;
    padding: 0.65rem 0.8rem;
    background: var(--primary-color, #35528c);
    color: #ffffff;
    font-weight: 700;
    border: none;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    font-size: 0.98rem;
    box-shadow: 0 4px 14px rgba(2, 6, 23, 0.06);
    transition:
      background 0.12s,
      transform 0.08s,
      box-shadow 0.12s;
    cursor: pointer;
  }
  .login-btn:hover {
    filter: brightness(0.95);
    transform: translateY(-1px);
  }
  .login-btn:focus {
    outline: 3px solid rgba(0, 0, 0, 0.06);
    outline-offset: 3px;
  }
  .login-btn[disabled] {
    opacity: 0.85;
    cursor: wait;
    transform: none;
  }
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    display: inline-block;
    animation: spin 0.9s linear infinite;
  }
  .spinner-container {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
  }
  .spinner-large {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(53, 82, 140, 0.2);
    border-top-color: #35528c;
    border-radius: 50%;
    display: inline-block;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .link-btn {
    background: transparent;
    border: none;
    color: #374151;
    text-decoration: underline;
    cursor: pointer;
    padding: 0.2rem 0;
    font-weight: 700;
  }
  .info-message {
    margin-top: 0.75rem;
    color: #065f46;
    background: #ecfdf5;
    padding: 0.6rem 0.8rem;
    border-radius: 8px;
    font-weight: 600;
    text-align: center;
  }
  .error-message {
    margin-top: 0.5rem;
    color: #b91c1c;
    background: #fee2e2;
    border: 1px solid rgba(185, 28, 28, 0.12);
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    font-weight: 700;
    text-align: center;
  }
  .success-icon {
    display: flex;
    justify-content: center;
    color: #10b981;
    margin-bottom: 1rem;
  }
  .error-icon {
    display: flex;
    justify-content: center;
    color: #f59e0b;
    margin-bottom: 1rem;
  }
  .mb-2 {
    margin-bottom: 0.5rem;
  }
</style>
