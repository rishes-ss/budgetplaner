<script>
  import { enhance } from '$app/forms';
  export let data;
  export let form;

  $: notice = form?.success ?? null;
  $: formErrors = form?.errors ?? {};

  function spentFor(category) {
    return data.transactions
      .filter((t) => t.type === 'expense' && t.category.toLowerCase() === category.toLowerCase())
      .reduce((s, t) => s + t.amount, 0);
  }

  function pct(b) {
    return Math.min(Math.round((spentFor(b.category) / b.limit) * 100), 100);
  }

  function progressClass(p) {
    if (p >= 100) return 'danger';
    if (p >= 80) return 'warn';
    return 'good';
  }

  function chf(v) {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(v);
  }

  const categories = [
    'Essen', 'Transport', 'Freizeit', 'Wohnen', 'Kleidung',
    'Gesundheit', 'Bildung', 'Unterhaltung', 'Sparen', 'Sonstiges'
  ];

  // Für jedes überschrittene Budget: finde das Budget mit dem grössten Puffer als Kürzungskandidat
  $: recommendations = (() => {
    const exceeded = data.budgets
      .map((b) => ({ ...b, spent: spentFor(b.category), overBy: spentFor(b.category) - b.limit }))
      .filter((b) => b.overBy > 0);

    return exceeded.map((exc) => {
      const candidates = data.budgets
        .filter((b) => b.category !== exc.category)
        .map((b) => ({ ...b, remaining: b.limit - spentFor(b.category) }))
        .filter((b) => b.remaining > 0)
        .sort((a, b) => b.remaining - a.remaining);

      return {
        exceeded: exc,
        target: candidates[0] ?? null,
        cutAmount: candidates[0] ? Math.min(exc.overBy, candidates[0].remaining) : 0
      };
    });
  })();
</script>

<svelte:head>
  <title>Budgets – BudgetPlaner</title>
</svelte:head>

<div class="page">
  <div class="shell">
    <h1 style="margin-bottom: 24px">Budgets</h1>

    {#if notice}
      <div class="notice notice-success">{notice}</div>
    {/if}

    <!-- Empfehlungen bei überschrittenen Budgets -->
    {#if recommendations.length > 0}
      <div class="recommendations">
        <div class="rec-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <h3>Empfehlungen</h3>
        </div>
        <div class="rec-list">
          {#each recommendations as rec}
            <div class="rec-item">
              <div class="rec-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              <div class="rec-body">
                <p class="rec-text">
                  <strong class="negative">{rec.exceeded.category}</strong>
                  ist um <strong class="negative">{chf(rec.exceeded.overBy)}</strong> überschritten.
                  {#if rec.target}
                    Kürze <strong class="warning">{rec.target.category}</strong>
                    um <strong>{chf(rec.cutAmount)}</strong>
                    <span class="muted">(hat noch {chf(rec.target.remaining)} Spielraum)</span>
                  {:else}
                    Kein anderes Budget hat genug Spielraum — erwäge, Ausgaben zu reduzieren.
                  {/if}
                </p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="grid-split">
      <!-- Form -->
      <div class="card">
        <h2 style="margin-bottom: 18px">Budget anlegen / anpassen</h2>
        <p class="form-hint">Existiert bereits ein Budget für die Kategorie, wird es automatisch aktualisiert.</p>

        <form method="POST" action="?/save" use:enhance class="budget-form">
          <div class="form-group">
            <label for="category">Kategorie</label>
            <input
              id="category"
              name="category"
              type="text"
              required
              placeholder="z.B. Essen"
              list="cat-list"
              value={form?.values?.category ?? ''}
            />
            {#if formErrors.category}<span class="error-msg">{formErrors.category}</span>{/if}
          </div>

          <div class="form-group">
            <label for="limit">Monatsbudget (CHF)</label>
            <input
              id="limit"
              name="limit"
              type="number"
              min="0.01"
              step="any"
              required
              placeholder="300"
              value={form?.values?.limit ?? ''}
            />
            {#if formErrors.limit}<span class="error-msg">{formErrors.limit}</span>{/if}
          </div>

          <button type="submit" class="btn btn-primary btn-block">Budget speichern</button>
        </form>

        <datalist id="cat-list">
          {#each categories as c}<option value={c}></option>{/each}
        </datalist>

        {#if data.budgets.length > 0}
          <div class="summary-box">
            <h3>Zusammenfassung</h3>
            <div class="summary-row">
              <span>Budgets gesamt</span>
              <strong>{chf(data.budgets.reduce((s, b) => s + b.limit, 0))}</strong>
            </div>
            <div class="summary-row">
              <span>Ausgaben total</span>
              <strong class="negative">{chf(data.budgets.reduce((s, b) => s + spentFor(b.category), 0))}</strong>
            </div>
            <div class="summary-row">
              <span>Überschrittene</span>
              <strong class:negative={data.budgets.filter((b) => spentFor(b.category) > b.limit).length > 0}>
                {data.budgets.filter((b) => spentFor(b.category) > b.limit).length} von {data.budgets.length}
              </strong>
            </div>
          </div>
        {/if}
      </div>

      <!-- Budget Cards -->
      <div>
        {#if data.budgets.length === 0}
          <div class="card empty-state">
            <p>Noch keine Budgets angelegt.</p>
            <p class="muted" style="font-size:0.88rem">Erstelle dein erstes Budget im Formular links.</p>
          </div>
        {:else}
          <div class="budget-grid">
            {#each data.budgets as b}
              {@const spent = spentFor(b.category)}
              {@const p = pct(b)}
              {@const pc = progressClass(p)}
              <div class="card budget-card" class:card-warn={p >= 80 && p < 100} class:card-danger={p >= 100}>
                <div class="budget-head">
                  <div>
                    <h3 class="budget-cat">{b.category}</h3>
                    {#if p >= 100}
                      <span class="badge badge-red">Überschritten!</span>
                    {:else if p >= 80}
                      <span class="badge badge-orange">Fast aufgebraucht</span>
                    {:else}
                      <span class="badge badge-green">Im Rahmen</span>
                    {/if}
                  </div>
                  <form method="POST" action="?/delete" use:enhance>
                    <input type="hidden" name="id" value={b._id} />
                    <button
                      type="submit"
                      class="btn btn-ghost btn-sm btn-danger"
                      title="Budget löschen"
                      on:click={(e) => { if (!confirm('Budget löschen?')) e.preventDefault(); }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </form>
                </div>

                <div class="budget-amounts">
                  <div class="amount-block">
                    <span class="amount-label">Verbraucht</span>
                    <span class="amount-val" class:negative={p >= 100} class:warning={p >= 80 && p < 100} class:positive={p < 80}>
                      {chf(spent)}
                    </span>
                  </div>
                  <div class="amount-sep">/</div>
                  <div class="amount-block">
                    <span class="amount-label">Budget</span>
                    <span class="amount-val">{chf(b.limit)}</span>
                  </div>
                  <div class="amount-block remaining">
                    <span class="amount-label">Übrig</span>
                    <span class="amount-val" class:negative={spent > b.limit} class:positive={spent <= b.limit}>
                      {chf(Math.max(b.limit - spent, 0))}
                    </span>
                  </div>
                </div>

                <div class="progress-track" style="height: 10px">
                  <div class="progress-bar {pc}" style="width:{p}%"></div>
                </div>

                <p class="pct-label muted">{p}% verbraucht</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .form-hint {
    font-size: 0.82rem;
    color: var(--text-3);
    margin-bottom: 16px;
  }

  .budget-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .summary-box {
    margin-top: 24px;
    padding: 16px;
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-sm);
    background: var(--surface-soft);
  }

  .summary-box h3 {
    margin-bottom: 12px;
    font-size: 0.88rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-3);
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    padding: 6px 0;
    border-bottom: 1px solid var(--border-soft);
  }

  .summary-row:last-child {
    border-bottom: none;
  }

  .budget-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .budget-card {
    transition: border-color 0.15s;
  }

  .card-warn {
    border-color: var(--orange-border);
    background: linear-gradient(135deg, var(--surface), var(--orange-bg));
  }

  .card-danger {
    border-color: var(--red-border);
    background: linear-gradient(135deg, var(--surface), var(--red-bg));
  }

  .budget-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 8px;
  }

  .budget-cat {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .budget-amounts {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .amount-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .amount-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-3);
  }

  .amount-val {
    font-size: 1rem;
    font-weight: 700;
  }

  .amount-sep {
    color: var(--text-3);
    font-size: 1.1rem;
    align-self: flex-end;
    padding-bottom: 2px;
  }

  .remaining {
    margin-left: auto;
  }

  .pct-label {
    font-size: 0.78rem;
    margin-top: 8px;
    margin-bottom: 0;
  }

  @media (max-width: 700px) {
    .budget-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ─── Empfehlungen ────────────────────────────────────────── */

  .recommendations {
    margin-bottom: 24px;
    border: 1px solid var(--red-border);
    border-radius: var(--radius);
    background: var(--red-bg);
    padding: 18px 20px;
  }

  .rec-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    color: var(--red);
  }

  .rec-header h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .rec-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .rec-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    border: 1px solid var(--red-border);
  }

  .rec-icon {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--orange-bg);
    border: 1px solid var(--orange-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--orange);
    margin-top: 1px;
  }

  .rec-body {
    flex: 1;
  }

  .rec-text {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.6;
    color: var(--text);
  }

  .rec-text .muted {
    font-size: 0.82rem;
  }
</style>
