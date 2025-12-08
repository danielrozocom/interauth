<script lang="ts">
  // Clean, single Svelte file for password recovery
  import type { PageData } from "./$types";
  import PasswordInput from "$lib/components/PasswordInput.svelte";
  import { onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { createSupabaseBrowserClient } from "$lib/supabase/browserClient";

  export let data: PageData;

  const supabase = createSupabaseBrowserClient({});

  type Step = "email" | "otp" | "new_password" | "success";
  let currentStep: Step = "email";

  let isPasswordSubmitting = false;
  $: isLoading = isPasswordSubmitting;

  let email = "";
  let password = "";
  let confirmPassword = "";
  let otpCode = "";
  let infoMessage: string | null = null;
  let isError = false;

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

  async function sendOtpCode() {
    isPasswordSubmitting = true;
    infoMessage = null;
    isError = false;

    if (!validateEmail(email)) {
      infoMessage = "Ingresa un email válido.";
      isError = true;
      isPasswordSubmitting = false;
      return;
    }

    if (cooldownSeconds > 0) return;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      currentStep = "otp";
      startCooldown();
    } catch (err: any) {
      console.error("Error enviando OTP:", err);
      if (err?.message && err.message.includes("Signups not allowed for otp")) {
        infoMessage = "No pudimos encontrar una cuenta con este correo.";
      } else {
        infoMessage =
          err?.message || "No pudimos enviar el código. Intenta de nuevo.";
      }
      isError = true;
    } finally {
      isPasswordSubmitting = false;
    }
  }

  async function verifyOtpCode() {
    isPasswordSubmitting = true;
    infoMessage = null;
    isError = false;

    if (!otpCode || otpCode.length < 6) {
      infoMessage = "El código debe tener 6 dígitos.";
      isError = true;
      isPasswordSubmitting = false;
      return;
    }

    try {
      const { data: sessionData, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: "email",
      });
      if (error) throw error;
      currentStep = "new_password";
      password = "";
      confirmPassword = "";
    } catch (err: any) {
      console.error("Error verificando OTP:", err);
      infoMessage = "El código no es válido o ya expiró. Pide uno nuevo.";
      isError = true;
    } finally {
      isPasswordSubmitting = false;
    }
  }

  async function updatePasswordFinal() {
    isPasswordSubmitting = true;
    infoMessage = null;
    isError = false;

    if (!password || password.length < 6) {
      infoMessage = "La contraseña debe tener al menos 6 caracteres.";
      isError = true;
      isPasswordSubmitting = false;
      return;
    }

    if (password !== confirmPassword) {
      infoMessage = "Las contraseñas no coinciden.";
      isError = true;
      isPasswordSubmitting = false;
      return;
    }

    try {
      const { data: probeData } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (probeData?.session) {
        infoMessage = "La nueva contraseña no puede ser igual a la actual.";
        isError = true;
        isPasswordSubmitting = false;
        return;
      }
    } catch {
      // ignore
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      currentStep = "success";
    } catch (err: any) {
      console.error("Error actualizando password:", err);
      if (
        err?.message &&
        err.message.toLowerCase().includes("same as current")
      ) {
        infoMessage = "La nueva contraseña no puede ser igual a la actual.";
      } else {
        infoMessage = "No se pudo actualizar la contraseña. Intenta de nuevo.";
      }
      isError = true;
    } finally {
      isPasswordSubmitting = false;
    }
  }

  function resetFlow() {
    currentStep = "email";
    password = "";
    confirmPassword = "";
    otpCode = "";
    infoMessage = null;
    isError = false;
  }

  function goToLogin() {
    const system = data.system;
    const url = system ? `/?system=${system}` : "/";
    goto(url);
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
          <p>Ingresa tu correo para recibir un código de acceso.</p>
          <img
            src="/favicon.svg"
            alt="Logo"
            class="top-logo"
            style:display={currentStep === "success" ? "none" : "block"}
          />
          <div class="form-group">
            <input
              type="email"
              placeholder="Correo electrónico"
              bind:value={email}
              class="input"
            />
            <button
              on:click={sendOtpCode}
              class="login-btn mb-2"
              disabled={isLoading ||
                !validateEmail(email) ||
                cooldownSeconds > 0}
            >
              {#if isPasswordSubmitting}<span class="spinner"
                ></span>{:else if cooldownSeconds > 0}Espera {cooldownSeconds}s{:else}Enviar
                código{/if}
            </button>
            {#if infoMessage}<div
                class={isError ? "error-message" : "info-message"}
              >
                {infoMessage}
              </div>{/if}
            <button class="link-btn" on:click={goToLogin}
              >Volver al login</button
            >
          </div>
        {:else if currentStep === "otp"}
          <h2>Verificar Código</h2>
          <p>Ingresa el código enviado a <strong>{email}</strong></p>
          <img
            src="/favicon.svg"
            alt="Logo"
            class="top-logo"
            style:display={currentStep === "success" ? "none" : "block"}
          />
          <div class="form-group">
            <input
              type="tel"
              placeholder="Código de 6 dígitos"
              value={otpCode}
              on:input={(e) =>
                (otpCode = e.currentTarget.value.replace(/\D/g, ""))}
              class="input otp-input"
              maxlength="6"
            />
            <button
              on:click={verifyOtpCode}
              class="login-btn mb-2"
              disabled={isLoading || otpCode.length < 6}
              >{#if isPasswordSubmitting}<span class="spinner"
                ></span>{:else}Verificar código{/if}</button
            >
            {#if infoMessage}<div
                class={isError ? "error-message" : "info-message"}
              >
                {infoMessage}
              </div>{/if}
            <button
              class="link-btn"
              disabled={isLoading || cooldownSeconds > 0}
              style:opacity={cooldownSeconds > 0 ? "0.5" : "1"}
              style:cursor={cooldownSeconds > 0 ? "not-allowed" : "pointer"}
              on:click={sendOtpCode}
              >{#if cooldownSeconds > 0}Reenviar en {cooldownSeconds}s{:else}Reenviar
                código{/if}</button
            >
          </div>
        {:else if currentStep === "new_password"}
          <h2>Nueva Contraseña</h2>
          <p>Ingresa tu nueva contraseña.</p>
          <img
            src="/favicon.svg"
            alt="Logo"
            class="top-logo"
            style:display={currentStep === "success" ? "none" : "block"}
          />
          <div class="form-group">
            <PasswordInput
              bind:value={password}
              placeholder="Nueva contraseña"
              disabled={isLoading}
            />
            <PasswordInput
              bind:value={confirmPassword}
              placeholder="Confirmar contraseña"
              disabled={isLoading}
            />
            <button
              on:click={updatePasswordFinal}
              class="login-btn mb-2"
              disabled={isLoading ||
                password.length < 6 ||
                password !== confirmPassword}
              >{#if isPasswordSubmitting}<span class="spinner"
                ></span>{:else}Cambiar contraseña{/if}</button
            >
            {#if infoMessage}<div
                class={isError ? "error-message" : "info-message"}
              >
                {infoMessage}
              </div>{/if}
          </div>
        {:else}
          <div class="success-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              width="80"
              height="80"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              /></svg
            >
          </div>
          <h2>¡Listo!</h2>
          <div class="form-group">
            <p>
              Tu contraseña se actualizó correctamente.<br />Ahora puedes
              iniciar sesión normalmente.
            </p>
            {#if infoMessage}<div
                class={isError ? "error-message" : "info-message"}
              >
                {infoMessage}
              </div>{/if}<button on:click={goToLogin} class="login-btn"
              >Ir al Login</button
            >
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
    margin-bottom: 1.5rem;
    text-align: center;
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
  .otp-input {
    letter-spacing: 4px;
    font-size: 1.2rem;
    text-align: center;
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
  .mb-2 {
    margin-bottom: 0.5rem;
  }
</style>
