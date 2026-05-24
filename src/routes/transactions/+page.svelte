<script>
  import { enhance } from '$app/forms';
  export let data;
  export let form;

  let editing = null;
  let filterType = 'all';
  let filterCat = '';

  $: notice = form?.success ?? null;
  $: formErrors = form?.errors ?? {};
  $: formValues = form?.values ?? {};

  $: if (form?.success && form?.action !== 'update') editing = null;

  $: filtered = data.transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCat && !t.category.toLowerCase().includes(filterCat.toLowerCase())) return false;
    return true;
  });

  function startEdit(tx) {
    editing = { ...tx };
  }

  function cancelEdit() {
    editing = null;
  }

  function chf(v) {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(v);
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const today = new Date().toISOString().slice(0, 10);

  $: categories = [...new Set(data.transactions.map((t) => t.category))].sort();
</script>

<svelte:head>
  <title>Transaktionen – BudgetPlaner</title>
</svelte:head>

<div class="page">
  <div class="shell">
    <h1 style="margin-bottom: 24px">Transaktionen</h1>

    {#if notice}
      <div class="notice notice-success">{notice}</div>
    {/if}

    <div class="grid-split">
      <!-- Form Panel -->
      <div class="card">
        <h2 style="margin-bottom: 18px">{editing ? 'Bearbeiten' : 'Neue Transaktion'}</h2>

        {#if editing}
          <form method="POST" action="?/update" use:enhance class="tx-form">
            <input type="hidden" name="id" value={editing._id} />
            <div class="form-group">
              <label for="edit-title">Titel</label>
              <input id="edit-title" name="title" type="text" value={editing.title} required placeholder="z.B. Mensa" />
              {#if formErrors.title}<span class="error-msg">{formErrors.title}</span>{/if}
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-amount">Betrag (CHF)</label>
                <input id="edit-amount" name="amount" type="number" min="0.01" step="0.05" value={editing.amount} required placeholder="0.00" />
                {#if formErrors.amount}<span class="error-msg">{formErrors.amount}</span>{/if}
              </div>
              <div class="form-group">
                <label for="edit-type">Typ</label>
                <select id="edit-type" name="type">
                  <option value="expense" selected={editing.type === 'expense'}>Ausgabe</option>
                  <option value="income" selected={editing.type === 'income'}>Einnahme</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-category">Kategorie</label>
                <input id="edit-category" name="category" type="text" value={editing.category} required placeholder="z.B. Essen" list="cat-suggestions" />
                {#if formErrors.category}<span class="error-msg">{formErrors.category}</span>{/if}
              </div>
              <div class="form-group">
                <label for="edit-date">Datum</label>
                <input id="edit-date" name="date" type="date" value={editing.date} required />
              </div>
            </div>
            <div class="form-group">
              <label for="edit-note">Notiz (optional)</label>
              <input id="edit-note" name="note" type="text" value={editing.note} placeholder="Optionaler Kontext" />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Speichern</button>
              <button type="button" class="btn" on:click={cancelEdit}>Abbrechen</button>
            </div>
          </form>
        {:else}
          <form method="POST" action="?/create" use:enhance class="tx-form">
            <div class="form-group">
              <label for="title">Titel</label>
              <input id="title" name="title" type="text" value={formValues.title ?? ''} required placeholder="z.B. Mensa Mittagessen" />
              {#if formErrors.title}<span class="error-msg">{formErrors.title}</span>{/if}
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="amount">Betrag (CHF)</label>
                <input id="amount" name="amount" type="number" min="0.01" step="0.05" value={formValues.amount ?? ''} required placeholder="0.00" />
                {#if formErrors.amount}<span class="error-msg">{formErrors.amount}</span>{/if}
              </div>
              <div class="form-group">
                <label for="type">Typ</label>
                <select id="type" name="type">
                  <option value="expense" selected={formValues.type !== 'income'}>Ausgabe</option>
                  <option value="income" selected={formValues.type === 'income'}>Einnahme</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="category">Kategorie</label>
                <input id="category" name="category" type="text" value={formValues.category ?? ''} required placeholder="z.B. Essen" list="cat-suggestions" />
                {#if formErrors.category}<span class="error-msg">{formErrors.category}</span>{/if}
              </div>
              <div class="form-group">
                <label for="date">Datum</label>
                <input id="date" name="date" type="date" value={formValues.date ?? today} required />
                {#if formErrors.date}<span class="error-msg">{formErrors.date}</span>{/if}
              </div>
            </div>
            <div class="form-group">
              <label for="note">Notiz (optional)</label>
              <input id="note" name="note" type="text" value={formValues.note ?? ''} placeholder="Optionaler Kontext" />
            </div>
            <button type="submit" class="btn btn-primary btn-block">Transaktion speichern</button>
          </form>
        {/if}

        <datalist id="cat-suggestions">
          {#each categories as cat}
            <option value={cat}></option>
          {/each}
        </datalist>
      </div>

      <!-- List Panel -->
      <div class="card">
        <div class="list-header">
          <h2>Alle Transaktionen <span class="muted count">({filtered.length})</span></h2>
          <div class="filters">
            <select bind:value={filterType} class="filter-select">
              <option value="all">Alle</option>
              <option value="expense">Ausgaben</option>
              <option value="income">Einnahmen</option>
            </select>
            <input type="text" bind:value={filterCat} placeholder="Kategorie filtern…" class="filter-input" />
          </div>
        </div>

        {#if filtered.length === 0}
          <p class="empty-state">Keine Transaktionen gefunden.</p>
        {:else}
          <div class="tx-list">
            {#each filtered as tx}
              <div class="tx-item">
                <div class="tx-icon" class:tx-in={tx.type === 'income'} class:tx-out={tx.type === 'expense'}>
                  {tx.type === 'income' ? '↑' : '↓'}
                </div>
                <div class="tx-body">
                  <span class="tx-title">{tx.title}</span>
                  <span class="tx-meta">
                    {tx.category} · {fmtDate(tx.date)}
                    {#if tx.note}<span class="tx-note"> · {tx.note}</span>{/if}
                  </span>
                </div>
                <div class="tx-right">
                  <span class="tx-amount" class:positive={tx.type === 'income'} class:negative={tx.type === 'expense'}>
                    {tx.type === 'income' ? '+' : '−'}{chf(tx.amount)}
                  </span>
                  <div class="tx-actions">
                    <button class="btn btn-ghost btn-sm" on:click={() => startEdit(tx)} title="Bearbeiten">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <form method="POST" action="?/delete" use:enhance style="display:inline">
                      <input type="hidden" name="id" value={tx._id} />
                      <button
                        type="submit"
                        class="btn btn-ghost btn-sm btn-danger"
                        title="Löschen"
                        on:click={(e) => { if (!confirm('Transaktion löschen?')) e.preventDefault(); }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .tx-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .form-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .list-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  .list-header h2 {
    margin: 0;
  }

  .count {
    font-size: 0.85rem;
    font-weight: 500;
  }

  .filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-select,
  .filter-input {
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    font-size: 0.82rem;
    min-height: 34px;
    width: auto;
  }

  .filter-input {
    width: 150px;
  }

  .tx-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 560px;
    overflow-y: auto;
  }

  .tx-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-sm);
    background: var(--surface-soft);
    transition: background 0.15s;
  }

  .tx-item:hover {
    background: var(--surface-hover);
  }

  .tx-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .tx-in {
    background: var(--green-bg);
    color: var(--green);
    border: 1px solid var(--green-border);
  }

  .tx-out {
    background: var(--red-bg);
    color: var(--red);
    border: 1px solid var(--red-border);
  }

  .tx-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tx-title {
    font-size: 0.88rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tx-meta {
    font-size: 0.74rem;
    color: var(--text-3);
  }

  .tx-note {
    font-style: italic;
  }

  .tx-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .tx-amount {
    font-size: 0.9rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .tx-actions {
    display: flex;
    gap: 2px;
  }

  @media (max-width: 480px) {
    .list-header {
      flex-direction: column;
    }

    .filters {
      width: 100%;
    }

    .filter-input {
      flex: 1;
    }
  }
</style>
