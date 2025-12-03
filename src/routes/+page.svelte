<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;

  let loading = false;
  let nextTarget = "/home";

  $: (function () {
    try {
      const s = typeof window !== "undefined" ? window.location.search : "";
      const n = new URLSearchParams(s).get("next");
      nextTarget = n || "/home";
    } catch {
      nextTarget = "/home";
    }
  })();

  async function loginWithGoogle() {
    loading = true;

    try {
      const redirectUrl =
        data?.brandConfig?.redirectUrlAfterLogin ||
        (typeof window !== "undefined" ? window.location.origin : "/");
      const supabaseUrl =
        data?.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error("Supabase URL no disponible");

      const authorizeUrl = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
        redirectUrl
      )}`;

      window.location.href = authorizeUrl;
    } catch (err) {
      console.error("Error iniciando login con Supabase:", err);
      alert("No se pudo iniciar el login.");
      loading = false;
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

      <button
        on:click={loginWithGoogle}
        class="login-btn mb-3"
        disabled={loading}
        aria-busy={loading}
        aria-label="Iniciar sesión con Google"
      >
        {#if loading}
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
    overflow: auto;
    padding: 1.5rem 0;
  }
  .card {
    background: linear-gradient(180deg, #ffffff, #fbfdff);
    padding: 0;
    border-radius: 14px;
    border: 1px solid rgba(2, 6, 23, 0.03);
    box-shadow: 0 10px 22px rgba(2, 6, 23, 0.04);
    /* Compact card for better desktop density */
    width: 360px;
    max-width: min(420px, 92%);
    overflow: hidden;
    max-height: calc(100vh - var(--topbar-h, 64px) - 48px);
    position: relative;
    margin: 0 auto;
  }
  /* Desktop polish */
  @media (min-width: 1000px) {
    /* Slightly larger on wide screens but still compact */
    .card {
      width: 420px;
      border-radius: 16px;
      box-shadow: 0 14px 34px rgba(2, 6, 23, 0.05);
    }
    .card-body {
      padding: 1.25rem 1.5rem;
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
  }
  .brand h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: 0.4px;
  }
  .card-body {
    padding: 1rem 1.25rem;
    overflow: auto;
    max-height: calc(100vh - 160px);
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
    border-radius: 10px;
    background: transparent;
    padding: 0;
    box-shadow: 0 6px 12px rgba(2, 6, 23, 0.04);
  }
  @media (max-height: 700px), (max-width: 420px) {
    .card {
      max-height: 92vh;
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
</style>
