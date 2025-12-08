<script>
  import { page } from "$app/stores";
</script>

<div class="error-page">
  <div class="content">
    <h1>Error de Enlace</h1>
    <p>
      El enlace que intentaste usar no es válido, ha expirado o ya fue
      utilizado.
    </p>
    <p class="hint">
      Por motivos de seguridad, los enlaces de acceso solo funcionan una vez y
      tienen un tiempo límite.
    </p>

    <a href="/" class="btn">Solicitar nuevo enlace</a>
  </div>
</div>

<style>
  .error-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    text-align: center;
    font-family: sans-serif;
  }
  .content {
    max-width: 400px;
    padding: 2rem;
  }
  h1 {
    color: #333;
    margin-bottom: 1rem;
  }
  p {
    color: #666;
    line-height: 1.6;
    margin-bottom: 1rem;
  }
  .hint {
    font-size: 0.9rem;
    color: #888;
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  .btn {
    background: #35528c;
    color: white;
    text-decoration: none;
    padding: 0.8rem 1.5rem;
    border-radius: 6px;
    font-weight: bold;
  }
</style>
