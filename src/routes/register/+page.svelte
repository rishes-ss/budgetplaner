<script>
  import { enhance } from '$app/forms';
  export let form;
</script>

<svelte:head>
  <title>Registrieren – BudgetPlaner</title>
</svelte:head>

<div class="auth-page">
  <div class="auth-card">
    <div class="auth-logo">₣</div>
    <h1>Konto erstellen</h1>
    <p class="auth-sub">Erstelle dein kostenloses BudgetPlaner-Konto.</p>

    <form method="POST" use:enhance class="auth-form">
      <div class="form-group">
        <label for="username">Benutzername</label>
        <input
          type="text"
          id="username"
          name="username"
          value={form?.username ?? ''}
          required
          autocomplete="username"
          placeholder="z.B. max123"
        />
        {#if form?.errors?.username}<span class="error-msg">{form.errors.username}</span>{/if}
      </div>

      <div class="form-group">
        <label for="email">E-Mail</label>
        <input
          type="email"
          id="email"
          name="email"
          value={form?.email ?? ''}
          required
          autocomplete="email"
          placeholder="name@beispiel.ch"
        />
        {#if form?.errors?.email}<span class="error-msg">{form.errors.email}</span>{/if}
      </div>

      <div class="form-group">
        <label for="password">Passwort</label>
        <input
          type="password"
          id="password"
          name="password"
          required
          autocomplete="new-password"
          placeholder="Mindestens 6 Zeichen"
        />
        {#if form?.errors?.password}<span class="error-msg">{form.errors.password}</span>{/if}
      </div>

      <div class="form-group">
        <label for="confirm">Passwort bestätigen</label>
        <input
          type="password"
          id="confirm"
          name="confirm"
          required
          autocomplete="new-password"
          placeholder="Passwort wiederholen"
        />
        {#if form?.errors?.confirm}<span class="error-msg">{form.errors.confirm}</span>{/if}
      </div>

      <button type="submit" class="btn btn-primary btn-lg btn-block" style="margin-top: 8px">
        Konto erstellen
      </button>
    </form>

    <p class="auth-footer">
      Bereits ein Konto? <a href="/login">Jetzt anmelden</a>
    </p>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: var(--bg);
  }

  .auth-card {
    width: 100%;
    max-width: 420px;
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    padding: 44px 40px;
    text-align: center;
  }

  .auth-logo {
    font-size: 2.8rem;
    color: var(--primary);
    line-height: 1;
    margin-bottom: 16px;
  }

  h1 {
    margin-bottom: 6px;
    font-size: 1.4rem;
  }

  .auth-sub {
    color: var(--text-3);
    font-size: 0.9rem;
    margin-bottom: 28px;
  }

  .auth-form {
    display: grid;
    gap: 14px;
    text-align: left;
  }

  .auth-footer {
    margin-top: 24px;
    margin-bottom: 0;
    font-size: 0.88rem;
    color: var(--text-3);
  }

  @media (max-width: 480px) {
    .auth-card {
      padding: 32px 24px;
    }
  }
</style>
