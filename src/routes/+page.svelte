<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;

  let loadingEmail = false;
  let loadingOAuth = false;
  let loadingReset = false;

  $: isLoading = loadingEmail || loadingOAuth || loadingReset;
  let email = "";
  let password = "";
  let forgotMode = false;
  let infoMessage: string | null = null;
  let showPassword = false;

  // Función para validar formato de email
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // Determinar el sistema desde la URL (ej: ?system=pos)
  $: systemParam = (() => {
    try {
      if (typeof window !== "undefined") {
        return (
          new URLSearchParams(window.location.search).get("system") || "pos"
        );
      }
      return "pos";
    } catch {
      return "pos";
    }
  })();

  // Construir la URL de callback según el sistema
  $: callbackUrl = (() => {
    const isDev = import.meta.env.DEV;
    const system = systemParam.toLowerCase();

    let url;
    // Mapear sistema a variable de entorno
    if (system === "pos" || system === "interpos") {
      url = isDev
        ? import.meta.env.VITE_POS_CALLBACK_URL_DEV ||
          import.meta.env.VITE_POS_CALLBACK_URL
        : import.meta.env.VITE_POS_CALLBACK_URL;
    } else if (system === "app" || system === "interapp") {
      url = isDev
        ? import.meta.env.VITE_APP_CALLBACK_URL_DEV ||
          import.meta.env.VITE_APP_CALLBACK_URL
        : import.meta.env.VITE_APP_CALLBACK_URL;
    } else {
      // Fallback: usar la configuración del brandConfig si existe
      url =
        data?.brandConfig?.redirectUrlAfterLogin ||
        import.meta.env.VITE_POS_CALLBACK_URL;
    }

    return url;
  })();

  async function loginWithGoogle() {
    loadingOAuth = true;

    try {
      const { data: res, error } = await data.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (res && (res as any).url) {
        window.location.href = (res as any).url;
        return;
      }

      const target = data?.brandConfig?.redirectUrlAfterLogin || "/";
      window.location.replace(target);
    } catch (err: any) {
      console.error("Error iniciando sesión con Google:", err);
      infoMessage = err.message || String(err);
      loadingOAuth = false;
    }
  }

  async function loginWithEmail() {
    loadingEmail = true;
    infoMessage = null;

    // Validar formato de email
    if (!isValidEmail(email)) {
      infoMessage = "Ingresa un email válido";
      loadingEmail = false;
      return;
    }

    try {
      const { data: res, error } = await data.supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // Si la sesión fue creada, redirigir al target configurado
      const target = data?.brandConfig?.redirectUrlAfterLogin || "/";
      window.location.replace(target);
    } catch (err: any) {
      console.error("Error iniciando sesión por correo:", err);
      // Mapear errores comunes a un mensaje más amigable
      const em = err || {};
      const messageText =
        em?.status === 400 ||
        /invalid|incorrect|credentials|no user/i.test(em?.message || "")
          ? "Credenciales inválidas"
          : em?.message || String(em);
      infoMessage = messageText;
      loadingEmail = false;
    }
  }

  async function sendPasswordReset() {
    loadingReset = true;
    infoMessage = null;

    // Validar formato de email
    if (!isValidEmail(email)) {
      infoMessage = "Ingresa un email válido";
      loadingReset = false;
      return;
    }

    try {
      const { data: res, error } =
        await data.supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: callbackUrl,
        });

      if (error) throw error;

      infoMessage =
        "Se ha enviado un correo con instrucciones. Revisa tu bandeja.";
      loadingReset = false;
    } catch (err: any) {
      console.error("Error enviando correo de recuperación:", err);
      infoMessage = err.message || String(err);
      loadingReset = false;
    }
  }
</script>

<svelte:head>
  <title>Login | {data?.brandConfig?.name || "InterAuth"}</title>
</svelte:head>

<div class="login-page">
  <div class="card">
    <div class="brand">
      <h1>{data?.brandConfig?.name || "InterAuth"}</h1>
    </div>
    <div class="card-body">
      <h2>Login</h2>
      <img
        src="/favicon.svg"
        alt="{data?.brandConfig?.name} logo"
        class="top-logo"
      />
      {#if !forgotMode}
        <div class="form-group">
          <input
            type="email"
            placeholder="Correo electrónico"
            bind:value={email}
            class="input"
            aria-label="Correo electrónico"
          />

          <div class="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              bind:value={password}
              class="input password-input"
              aria-label="Contraseña"
            />
            <button
              type="button"
              class="toggle-password"
              aria-label={showPassword
                ? "Ocultar contraseña"
                : "Mostrar contraseña"}
              on:click={() => (showPassword = !showPassword)}
            >
              {#if showPassword}
                <!-- eye-off -->
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  ><path
                    d="M3 3l18 18"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /><path
                    d="M10.58 10.58a3 3 0 0 0 4.24 4.24"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /><path
                    d="M9.53 5.09A10.94 10.94 0 0 1 12 4c5 0 9 3.5 10 8-0.57 2.08-1.63 3.86-3.07 5.29"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg
                >
              {:else}
                <!-- eye -->
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  ><path
                    d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /><circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg
                >
              {/if}
            </button>
          </div>

          <button
            on:click={loginWithEmail}
            class="login-btn mb-2"
            disabled={isLoading || !email || !password || !isValidEmail(email)}
            aria-busy={loadingEmail}
          >
            {#if loadingEmail}
              <span class="spinner" aria-hidden="true"></span>
              <span>Iniciando…</span>
            {:else}
              <span>Iniciar sesión con correo</span>
            {/if}
          </button>
          {#if infoMessage}
            <div class="error-message" role="alert" aria-live="assertive">
              {infoMessage}
            </div>
          {/if}

          <button
            type="button"
            class="link-btn"
            on:click={() => {
              forgotMode = true;
              infoMessage = null;
            }}
          >
            Olvidé mi contraseña
          </button>
        </div>
      {:else}
        <div class="form-group">
          <p>
            Introduce tu correo y te enviaremos un enlace para restablecer la
            contraseña.
          </p>
          <input
            type="email"
            placeholder="Correo electrónico"
            bind:value={email}
            class="input"
            aria-label="Correo electrónico"
          />

          <button
            on:click={sendPasswordReset}
            class="login-btn mb-2"
            disabled={isLoading || !email || !isValidEmail(email)}
            aria-busy={loadingReset}
          >
            {#if loadingReset}
              <span class="spinner" aria-hidden="true"></span>
              <span>Enviando…</span>
            {:else}
              <span>Enviar enlace de recuperación</span>
            {/if}
          </button>

          <button
            type="button"
            class="link-btn"
            on:click={() => {
              forgotMode = false;
              infoMessage = null;
            }}
          >
            Volver al inicio de sesión
          </button>
        </div>
      {/if}

      {#if infoMessage && forgotMode}
        <div class="info-message">{infoMessage}</div>
      {/if}
      <div class="separator-hr" aria-hidden="true"></div>

      <button
        on:click={loginWithGoogle}
        class="login-btn mb-3"
        disabled={isLoading}
        aria-busy={loadingOAuth}
        aria-label="Iniciar sesión con Google"
      >
        {#if loadingOAuth}
          <span class="spinner" aria-hidden="true"></span>
          <span>Redirigiendo…</span>
        {:else}
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
    </div>
  </div>
</div>

<style>
  .login-page {
    display: flex;
    min-height: calc(100vh - var(--topbar-h, 64px));
    align-items: center;
    justify-content: center;
    /* Let the browser handle scrolling to avoid nested scrollbars */
    overflow: visible;
    padding: 2rem 0;
  }
  .card {
    background: linear-gradient(180deg, #ffffff, #fbfdff);
    padding: 0;
    border-radius: 16px;
    border: 1px solid rgba(2, 6, 23, 0.06);
    box-shadow: 0 12px 30px rgba(2, 6, 23, 0.06);
    /* Compact card for better desktop density */
    width: 360px;
    max-width: min(420px, 92%);
    /* Keep rounded corners and avoid inner overflow (content may extend page) */
    overflow: hidden;
    max-height: none;
    position: relative;
    margin: 2rem auto;
  }

  /* When the card height exceeds the viewport, keep a comfortable top margin */
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
  /* Desktop polish */
  @media (min-width: 1000px) {
    /* Slightly larger on wide screens but still compact */
    .card {
      width: 560px;
      border-radius: 16px;
      box-shadow: 0 14px 34px rgba(2, 6, 23, 0.05);
      /* Allow enough height on desktop to avoid internal scroll */
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
    background: var(--primary);
    color: #fff;
    padding: 0.9rem 1rem;
    text-align: center;
    /* Round only the top corners so background matches the parent card */
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
    /* Allow the page to scroll instead of the card */
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
      /* Allow the card to grow and let the page scroll instead of clipping */
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
    background: var(--primary);
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
  .password-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .password-input {
    /* increase right padding to accommodate larger toggle button */
    padding-right: 56px;
    box-sizing: border-box;
    height: 40px;
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
  }
  .password-input:focus {
    border-color: var(--primary);
  }
  .toggle-password {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* match input height for perfect alignment */
    width: 40px;
    height: 40px;
    cursor: pointer;
    color: var(--primary);
    border-radius: 8px;
    box-shadow: none;
    padding: 4px;
    transition:
      background 0.12s,
      transform 0.08s,
      box-shadow 0.12s;
    z-index: 5;
  }
  .toggle-password:hover {
    background: rgba(0, 0, 0, 0.04);
    transform: translateY(-50%) scale(1.02);
  }
  .toggle-password svg {
    display: block;
    width: 18px;
    height: 18px;
    pointer-events: none;
  }
  .toggle-password:focus {
    outline: 3px solid rgba(59, 130, 246, 0.18);
    outline-offset: 2px;
  }
  .input {
    width: 100%;
    padding: 0.6rem 0.8rem;
    margin-bottom: 0.6rem;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    font-size: 0.95rem;
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
  }
  .error-message {
    margin-top: 0.5rem;
    color: #b91c1c;
    background: #fee2e2;
    border: 1px solid rgba(185, 28, 28, 0.12);
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    font-weight: 700;
  }
</style>
