<script lang="ts">
  import type { PageData } from "./$types";
  import { onDestroy, onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { get } from "svelte/store";
  import { recoveryEmail } from "$lib/recoveryStore";
  import { enhance } from "$app/forms";

  export let data: PageData;

  type Step = "email" | "sent";
  let currentStep: Step = "email";

  let isSubmitting = false;
  let email = "";
  let infoMessage: string | null = null;
  let isError = false;

  let redirectTo = "";

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    // Restore email from store if available
    const stored = get(recoveryEmail);
    if (stored) {
      email = stored;
    }
    // Build redirectTo param (used by the server action)
    const systemParam = params.get("system");
    const redirectParam = params.get("redirect_to");

    if (redirectParam) {
      redirectTo = redirectParam;
    } else if (systemParam) {
      redirectTo = data.brandConfig?.redirectUrlAfterLogin || "";
    }
  });

  let cooldownSeconds = 0;
  let timer: any;

  function startCooldown() {
    cooldownSeconds = 60;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      cooldownSeconds--;
      if (cooldownSeconds <= 0) {
        clearInterval(timer);
        cooldownSeconds = 0;
      }
    }, 1000);
  }

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });

  function validateEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  function handleEnhance() {
    isSubmitting = true;
    infoMessage = null;
    isError = false;

    return async ({ result }: { result: any }) => {
      isSubmitting = false;
      if (result.type === "success") {
        currentStep = "sent";
        startCooldown();
        recoveryEmail.set(email); // Save for later
      } else if (result.type === "failure") {
        isError = true;
        infoMessage = result.data?.error || "Error desconocido";
      } else if (result.type === "error") {
        isError = true;
        infoMessage = "Error del servidor";
      }
    };
  }

  function goToLogin() {
    const params = new URLSearchParams(window.location.search);
    if (email) recoveryEmail.set(email);
    params.delete("email");
    const qs = params.toString();
    goto(`/${qs ? `?${qs}` : ""}`);
  }
</script>

<svelte:head>
  <title
    >Recuperar Contraseña{data.brandConfig?.name
      ? ` | ${data.brandConfig.name}`
      : ""}</title
  >
</svelte:head>

{#if data.invalidAccess}
  <div class="login-page">
    <div class="card">
      <div class="brand" style="background:#000"><h1>Acceso no válido</h1></div>
      <div class="card-body">
        <h2>
          Para acceder a un sistema debes hacerlo desde la dirección oficial del
          mismo.
        </h2>
        <p style="text-align:center;margin-top:0.75rem">
          Si llegaste aquí desde un enlace, intenta acceder desde la URL del
          sistema.
        </p>
        <div style="display:flex;justify-content:center;margin-top:1rem">
          <a class="login-btn" href="https://interfundeoms.edu.co/"
            >Volver al sitio principal</a
          >
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="login-page">
    <div class="card">
      <div class="brand">
        {#if data.brandConfig?.name}<h1>{data.brandConfig.name}</h1>{/if}
      </div>
      <div class="card-body">
        {#if currentStep === "email"}
          <h2>Recuperar Contraseña</h2>
          <p>Ingresa tu correo para recibir un enlace de recuperación.</p>
          <img src="/favicon.svg" alt="Logo" class="top-logo" />
          <form
            class="form-group"
            method="POST"
            action="?/sendRecoveryLink"
            use:enhance={handleEnhance}
          >
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              bind:value={email}
              class="input"
            />
            <button
              type="submit"
              class="login-btn mb-2"
              disabled={isSubmitting ||
                !validateEmail(email) ||
                cooldownSeconds > 0}
            >
              {#if isSubmitting}
                <span class="spinner"></span>
              {:else if cooldownSeconds > 0}
                Espera {cooldownSeconds}s
              {:else}
                Enviar enlace
              {/if}
            </button>
            {#if infoMessage}
              <div class={isError ? "error-message" : "info-message"}>
                {infoMessage}
              </div>
            {/if}
            <button type="button" class="link-btn" on:click={goToLogin}>
              Volver al login
            </button>
          </form>
        {:else}
          <!-- Email sent - show success message -->
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2>¡Solicitud enviada!</h2>
          <div class="form-group">
            <p>
              Si tu correo <strong>{email}</strong> está registrado, te enviaremos
              un mensaje con instrucciones para restablecer tu contraseña.
            </p>
            <p class="hint">
              Revisa tu bandeja de entrada y la carpeta de spam.
            </p>

            <button
              type="button"
              class="link-btn"
              disabled={cooldownSeconds > 0}
              on:click={() => {
                currentStep = "email";
              }}
              style:opacity={cooldownSeconds > 0 ? "0.5" : "1"}
              style:cursor={cooldownSeconds > 0 ? "not-allowed" : "pointer"}
            >
              {#if cooldownSeconds > 0}
                Reenviar en {cooldownSeconds}s
              {:else}
                Reenviar enlace
              {/if}
            </button>

            <button type="button" class="link-btn" on:click={goToLogin}>
              Volver al login
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

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
    background: var(--primary-color);
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
  .hint {
    font-size: 0.9rem;
    color: #6b7280;
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
    background: var(--primary-color);
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
    text-decoration: none;
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
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .input {
    width: 100%;
    padding: 0.6rem 0.8rem;
    margin-bottom: 0.6rem;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    font-size: 0.95rem;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease,
      background 150ms ease;
  }
  .input:focus {
    outline: none;
    border-color: #35528c;
    box-shadow: 0 6px 18px rgba(53, 82, 140, 0.06);
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
    color: var(--primary-color, #35528c);
    margin-bottom: 1rem;
  }
  .mb-2 {
    margin-bottom: 0.5rem;
  }
</style>
