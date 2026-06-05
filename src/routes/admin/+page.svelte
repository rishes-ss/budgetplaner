<script>
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  $: users = data.users;
</script>

<svelte:head>
  <title>Admin – Benutzerverwaltung</title>
</svelte:head>

<div class="shell page-content">
  <header class="page-header">
    <div>
      <h1 class="page-title">Benutzerverwaltung</h1>
      <p class="page-sub">Alle registrierten Benutzer ({users.length})</p>
    </div>
  </header>

  {#if form?.error}
    <div class="alert alert-error">{form.error}</div>
  {/if}
  {#if form?.success}
    <div class="alert alert-success">Benutzer erfolgreich gelöscht.</div>
  {/if}

  <div class="card">
    {#if users.length === 0}
      <p class="empty-state">Keine Benutzer gefunden.</p>
    {:else}
      <table class="user-table">
        <thead>
          <tr>
            <th>Benutzer</th>
            <th>E-Mail</th>
            <th>Rolle</th>
            <th>Registriert</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each users as user (user.id)}
            <tr>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{user.username[0].toUpperCase()}</div>
                  <span class="user-name">{user.username}</span>
                </div>
              </td>
              <td class="email-cell">{user.email}</td>
              <td>
                <span class="badge {user.role === 'admin' ? 'badge-admin' : 'badge-user'}">
                  {user.role === 'admin' ? 'Admin' : 'Benutzer'}
                </span>
              </td>
              <td class="date-cell">
                {#if user.createdAt}
                  {new Date(user.createdAt).toLocaleDateString('de-CH')}
                {:else}
                  –
                {/if}
              </td>
              <td class="action-cell">
                {#if user.role !== 'admin'}
                  <form method="POST" action="?/deleteUser" use:enhance>
                    <input type="hidden" name="id" value={user.id} />
                    <button
                      type="submit"
                      class="btn btn-sm btn-danger"
                      onclick={(e) => { if (!confirm(`Benutzer «${user.username}» und alle seine Daten wirklich löschen?`)) e.preventDefault(); }}
                    >
                      Löschen
                    </button>
                  </form>
                {:else}
                  <span class="protected-label">Geschützt</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .page-content {
    padding-top: calc(var(--nav-height) + 32px);
    padding-bottom: 48px;
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
  }

  .page-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--text);
    margin: 0 0 4px;
  }

  .page-sub {
    color: var(--text-2);
    font-size: 0.88rem;
    margin: 0;
  }

  .alert {
    padding: 12px 16px;
    border-radius: var(--radius);
    margin-bottom: 20px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .alert-error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .alert-success {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .empty-state {
    padding: 48px;
    text-align: center;
    color: var(--text-2);
  }

  .user-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }

  .user-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-2);
    border-bottom: 1px solid var(--border-soft);
    background: var(--surface-soft);
  }

  .user-table td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-soft);
    color: var(--text);
    vertical-align: middle;
  }

  .user-table tr:last-child td {
    border-bottom: none;
  }

  .user-table tr:hover td {
    background: var(--surface-soft);
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--primary);
    color: var(--primary-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .user-name {
    font-weight: 600;
  }

  .email-cell {
    color: var(--text-2);
  }

  .date-cell {
    color: var(--text-2);
    white-space: nowrap;
  }

  .action-cell {
    text-align: right;
  }

  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .badge-admin {
    background: #fef3c7;
    color: #b45309;
  }

  .badge-user {
    background: var(--primary-light);
    color: var(--primary);
  }

  .btn-danger {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .btn-danger:hover {
    background: #dc2626;
    color: #fff;
    border-color: #dc2626;
  }

  .protected-label {
    font-size: 0.78rem;
    color: var(--text-2);
  }

  @media (max-width: 640px) {
    .email-cell,
    .date-cell {
      display: none;
    }
  }
</style>
