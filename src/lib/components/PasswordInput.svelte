<script lang="ts">
  export let id: string = "";
  export let name: string = "";
  export let value: string = "";
  export let placeholder: string = "Contraseña";
  export let disabled: boolean = false;
  export let error: string | null = null;
  let showPassword: boolean = false;
</script>

<div class="relative mb-3">
  <input
    {id}
    {name}
    type={showPassword ? "text" : "password"}
    {placeholder}
    bind:value
    {disabled}
    class="w-full h-10 px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-[#35528c] focus:shadow-lg"
    aria-label="Contraseña"
  />
  <button
    type="button"
    class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 text-[var(--primary-color)] hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-[#35528c]/20 rounded transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
    {disabled}
    on:click={() => (showPassword = !showPassword)}
  >
    {#if showPassword}
      <!-- eye-off -->
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        class="pointer-events-none"
      >
        <path
          d="M3 3l18 18"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M10.58 10.58a3 3 0 0 0 4.24 4.24"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M9.53 5.09A10.94 10.94 0 0 1 12 4c5 0 9 3.5 10 8-0.57 2.08-1.63 3.86-3.07 5.29"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    {:else}
      <!-- eye -->
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        class="pointer-events-none"
      >
        <path
          d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    {/if}
  </button>
  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>

<style>
  :global {
    :root {
      --primary-color: #35528c;
    }
  }
</style>
