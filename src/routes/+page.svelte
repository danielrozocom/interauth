<script lang="ts">
  import type { PageData } from "./$types";
  import PasswordInput from "$lib/components/PasswordInput.svelte";
  import { onMount, onDestroy } from "svelte";

  export let data: PageData;

  // Estados del flujo
  type Step = "login" | "email" | "otp" | "new_password" | "success";
  let currentStep: Step = "login";

  let isPasswordSubmitting = false;
  let isGoogleSubmitting = false;

  // Derived state to check if ANY loading is happening
  $: isLoading = isPasswordSubmitting || isGoogleSubmitting;

  let email = "";
  let password = "";
  let confirmPassword = "";
  let otpCode = "";
  let infoMessage: string | null = null;
  let isError = false;

  // Cooldown logic
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

  // Inicializar estado basado en datos del servidor (si vienes de un link mágico legacy)
  $: {
    const authInfo = (data as any).authInfo;
    if (
      authInfo?.valid &&
      (authInfo.event === "recovery" || authInfo.event === "invite") &&
      data.session &&
      currentStep === "login"
    ) {
      currentStep = "new_password";
      if (!infoMessage) {
        infoMessage = authInfo.message;
        isError = false;
      }
    }
    // Errores legacy
    if ((data as any).error) {
      infoMessage = (data as any).error;
      isError = true;
    }
  }

  function validateEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  // Paso 1: Enviar OTP
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

    if (cooldownSeconds > 0) {
      return;
    }

    try {
      const { error } = await (data as any).supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false, // Solo recuperación, no registro
        },
      });

      if (error) throw error;

      // Éxito: Pasar al paso 2
      currentStep = "otp";
      infoMessage = null;
      isError = false;
      startCooldown();
    } catch (err: any) {
      console.error("Error enviando OTP:", err);
      if (err.message && err.message.includes("Signups not allowed for otp")) {
        infoMessage = "No pudimos encontrar una cuenta con este correo.";
      } else {
        infoMessage =
          err.message || "No pudimos enviar el código. Intenta de nuevo.";
      }
      isError = true;
    } finally {
      isPasswordSubmitting = false;
    }
  }

  // Paso 2: Verificar OTP
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
      const { data: sessionData, error } = await (
        data as any
      ).supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: "email",
      });

      if (error) throw error;

      // Éxito: Pasar al paso 3 (Cambio de contraseña)
      currentStep = "new_password";
      password = ""; // Clear potential stale password
      confirmPassword = "";
      infoMessage = null;
      isError = false;
    } catch (err: any) {
      console.error("Error verificando OTP:", err);
      infoMessage = "El código no es válido o ya expiró. Pide uno nuevo.";
      isError = true;
    } finally {
      isPasswordSubmitting = false;
    }
  }

  // Paso 3: Cambiar Contraseña Final
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

    // Comprobación de que la contraseña no sea la actual (Probe)
    try {
      const { data: probeData, error: probeError } = await (
        data as any
      ).supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (probeData?.session) {
        // Login exitoso: significa que la clave es IGUAL a la actual.
        // Bloquear actualización.
        infoMessage = "La nueva contraseña no puede ser igual a la actual.";
        isError = true;
        // NO hacer signOut aquí, porque mata la sesión obtenida por OTP
        // y el usuario no podrá intentar con otra contraseña sin volver a empezar.

        isPasswordSubmitting = false;
        return;
      }

      // Si recibimos un error, asumiendo que es "Invalid login credentials",
      // significa que la contraseña es diferente => Proceder.
      // (Podrían ser otros errores, pero en este contexto si falla el login, asumimos es seguro intentar el update).
    } catch (probeErr) {
      // Ignorar error de probe, continuamos al update
    }

    try {
      const { error } = await (data as any).supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Cerrar sesión para seguridad
      await (data as any).supabase.auth.signOut();

      // Éxito Final
      currentStep = "success";
      infoMessage = null;
      isError = false;
    } catch (err: any) {
      console.error("Error actualizando password:", err);
      // Validar si el error viene de que la contraseña es igual (algunos backends lo dicen)
      // pero ya lo cubrimos con el probe.
      if (
        err.message &&
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

  // Login Normal (Legacy)
  async function loginWithEmail() {
    isPasswordSubmitting = true;
    infoMessage = null;
    isError = false;

    try {
      const { error } = await (data as any).supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      // Redirigir
      const target = data?.brandConfig?.redirectUrlAfterLogin || "/";
      window.location.replace(target);
    } catch (err: any) {
      infoMessage = "Credenciales inválidas";
      isError = true;
    } finally {
      isPasswordSubmitting = false;
    }
  }

  async function loginWithGoogle() {
    isGoogleSubmitting = true;
    try {
      const { data: res, error } = await (
        data as any
      ).supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/?system=${
            (data as any).system || "auth"
          }`,
        },
      });
      if (res?.url) window.location.href = res.url;
    } catch (err) {
      console.error(err);
      isGoogleSubmitting = false;
    }
    // Note: We don't set isGoogleSubmitting = false in success case immediately
    // because page redirect will happen. usage depends on provider.
  }

  function resetFlow() {
    currentStep = "login";
    // email = ""; // Mantener email para UX
    password = "";
    confirmPassword = "";
    otpCode = "";
    infoMessage = null;
    isError = false;
  }
</script>

<svelte:head>
  <title
    >{currentStep === "login" ? "Login" : "Recuperación de cuenta"} | {(
      data as any
    )?.brandConfig?.name || "InterAuth"}</title
  >
</svelte:head>

<div class="login-page">
  <div class="card">
    <div class="brand">
      <h1>{(data as any)?.brandConfig?.name || "InterAuth"}</h1>
    </div>
    <div class="card-body">
      <!-- Header Dinámico -->
      {#if currentStep === "login"}
        <h2>Login</h2>
      {:else if currentStep === "email"}
        <h2>Recuperar Cuenta</h2>
        <p>Ingresa tu correo para recibir un código de acceso.</p>
      {:else if currentStep === "otp"}
        <h2>Verificar Código</h2>
        <p>Ingresa el código enviado a <strong>{email}</strong></p>
      {:else if currentStep === "new_password"}
        <h2>Nueva Contraseña</h2>
        <p>Ingresa tu nueva contraseña.</p>
      {:else if currentStep === "success"}
        <div class="success-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            width="48"
            height="48"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2>¡Listo!</h2>
      {/if}

      <img
        src="/favicon.svg"
        alt="Logo"
        class="top-logo"
        style:display={currentStep === "success" ? "none" : "block"}
      />

      <!-- VISTA: LOGIN -->
      {#if currentStep === "login"}
        <div class="form-group">
          <input
            type="email"
            placeholder="Correo electrónico"
            bind:value={email}
            class="input"
            aria-label="Correo electrónico"
          />
          <PasswordInput
            bind:value={password}
            placeholder="Contraseña"
            disabled={isLoading}
          />

          <button
            on:click={loginWithEmail}
            class="login-btn mb-2"
            disabled={isLoading || !password || !validateEmail(email)}
          >
            {#if isPasswordSubmitting}
              <span class="spinner"></span>
            {:else}
              <span>Iniciar sesión con correo</span>
            {/if}
          </button>
          {#if infoMessage}
            <div
              class={isError ? "error-message" : "info-message"}
              role="alert"
            >
              {infoMessage}
            </div>
          {/if}

          <button
            class="link-btn"
            disabled={isLoading}
            on:click={() => {
              currentStep = "email";
              password = ""; // Clear password to prevent pre-fill
              infoMessage = null;
            }}
          >
            Olvidé mi contraseña
          </button>
        </div>

        <div class="separator-hr"></div>

        <button
          on:click={loginWithGoogle}
          class="login-btn mb-3 mobile-google-btn"
          disabled={isLoading}
          aria-label="Iniciar sesión con Google"
        >
          {#if isGoogleSubmitting}
            <span class="spinner" aria-hidden="true"></span>
            <span>Redirigiendo…</span>
          {:else}
            <!-- Google Icon: Shown ONLY when NOT submitting Google -->
            <span class="g-mark" aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 18 18"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.63-.06-1.23-.17-1.81H9v3.42h4.84c-.21 1.16-.84 2.15-1.8 2.82v2.34h2.91c1.7-1.57 2.69-3.86 2.69-6.77z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.91-2.34c-.8.54-1.82.86-3.05.86-2.35 0-4.34-1.58-5.05-3.72H1.02v2.33C2.5 15.78 5.53 18 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.95 10.63A5.41 5.41 0 0 1 3.6 9c0-.64.11-1.26.31-1.83V4.84H1.02A9 9 0 0 0 0 9c0 1.45.35 2.82.97 4.01l2.98-2.38z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.56c1.32 0 2.5.45 3.43 1.34l2.57-2.57C13.44.99 11.4 0 9 0 5.53 0 2.5 2.22 1.02 4.84l2.98 2.33C4.66 5.14 6.65 3.56 9 3.56z"
                />
              </svg>
            </span>
            <span>Iniciar sesión con Google</span>
          {/if}
        </button>

        <p class="help-text mt-4">
          Si necesitas ayuda contacta al administrador.
        </p>

        <!-- VISTA: PASO 1 (EMAIL) -->
      {:else if currentStep === "email"}
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
            disabled={isLoading || !validateEmail(email) || cooldownSeconds > 0}
          >
            {#if isPasswordSubmitting}
              <span class="spinner"></span>
            {:else if cooldownSeconds > 0}
              Espera {cooldownSeconds}s
            {:else}
              Enviar código
            {/if}
          </button>

          {#if infoMessage}
            <div class={isError ? "error-message" : "info-message"}>
              {infoMessage}
            </div>
          {/if}

          <button class="link-btn" on:click={resetFlow}>Volver al login</button>
        </div>

        <!-- VISTA: PASO 2 (OTP) -->
      {:else if currentStep === "otp"}
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
          >
            {#if isPasswordSubmitting}
              <span class="spinner"></span>
            {:else}
              Verificar código
            {/if}
          </button>

          {#if infoMessage}
            <div class={isError ? "error-message" : "info-message"}>
              {infoMessage}
            </div>
          {/if}

          <button
            class="link-btn"
            disabled={loading || cooldownSeconds > 0}
            style:opacity={cooldownSeconds > 0 ? "0.5" : "1"}
            style:cursor={cooldownSeconds > 0 ? "not-allowed" : "pointer"}
            on:click={sendOtpCode}
          >
            {#if cooldownSeconds > 0}
              Reenviar en {cooldownSeconds}s
            {:else}
              Reenviar código
            {/if}
          </button>
        </div>

        <!-- VISTA: PASO 3 (NUEVA CLAVE) -->
      {:else if currentStep === "new_password"}
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
          >
            {#if isPasswordSubmitting}
              <span class="spinner"></span>
            {:else}
              Cambiar contraseña
            {/if}
          </button>

          {#if infoMessage}
            <div class={isError ? "error-message" : "info-message"}>
              {infoMessage}
            </div>
          {/if}
        </div>

        <!-- VISTA: ÉXITO -->
      {:else if currentStep === "success"}
        <div class="form-group">
          <p>
            Tu contraseña se actualizó correctamente.<br />Ahora puedes iniciar
            sesión normalmente.
          </p>

          {#if infoMessage}
            <div class={isError ? "error-message" : "info-message"}>
              {infoMessage}
            </div>
          {/if}

          <button on:click={resetFlow} class="login-btn">Ir al Login</button>
        </div>
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
  .login-btn .g-mark {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(2, 6, 23, 0.08);
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
  .help-text {
    text-align: center;
    color: #374151;
    font-size: 0.95rem;
    font-weight: 600;
  }
  .mt-4 {
    margin-top: 1rem;
  }
  .separator-hr {
    width: 100%;
    height: 1px;
    background: #e5e7eb;
    margin: 1rem 0;
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
  /* Google Button Specifics (Simplified mixin style) */
  .mobile-google-btn {
    /* Inherits mostly from login-btn but ensure we match the white/text style if originally different? 
         Original button has .login-btn mb-3 (plus SVG inside). Not a separate class. 
         But typically Google button is white. I check logic:
         Original code used .login-btn for google too?
         Wait, checking previous file... 
         lines 292-294: class="login-btn mb-3" ... 
         Looking at the button inner HTML: it has span.g-mark... and text "Iniciar sesión con Google".
         Wait, CSS for .login-btn sets background to var(--primary). 
         Does original google button look blue? 
         Actually, there is no special class in original for google button except "login-btn mb-3".
         However, the SVG paths have colors (#4285F4, etc).
         If the button background is blue, the colorful G might look weird or the button is white?
         Let's re-read the original CSS carefully.
         .login-btn background is var(--primary).
         So yes, the Google button was likely Blue with a white circle (g-mark) containing the colored G.
         My new code preserves that structure: <span class="g-mark">...SVG...</span>.
         So I just need to make sure I use class="login-btn mb-3" and NOT add "google-btn" styles that might conflict or be missing.
      */
  }
</style>
