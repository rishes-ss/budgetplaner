<script>
  export let data;

  $: transactions = data.transactions;
  $: budgets = data.budgets;

  $: income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  $: expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  $: balance = income - expenses;
  $: recent = transactions.slice(0, 6);

  function spentFor(category) {
    return transactions
      .filter((t) => t.type === 'expense' && t.category.toLowerCase() === category.toLowerCase())
      .reduce((s, t) => s + t.amount, 0);
  }

  function budgetPercent(b) {
    return Math.min(Math.round((spentFor(b.category) / b.limit) * 100), 100);
  }

  function progressClass(pct) {
    if (pct >= 100) return 'danger';
    if (pct >= 80) return 'warn';
    return 'good';
  }

  function amountClass(pct) {
    if (pct >= 100) return 'negative';
    if (pct >= 80) return 'warning';
    return 'positive';
  }

  $: exceededCount = budgets.filter((b) => spentFor(b.category) > b.limit).length;

  function chf(v) {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(v);
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
  }
</script>

<svelte:head>
  <title>Dashboard – BudgetPlaner</title>
</svelte:head>

<div class="page">
  <div class="shell">
    <!-- Header -->
    <div class="page-header">
      <div>
        <p class="eyebrow">Willkommen zurück, {data.user.username} 👋</p>
        <h1>Deine Finanzen</h1>
      </div>
      <a href="/transactions" class="btn btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Transaktion erfassen
      </a>
    </div>

    <!-- Stats -->
    <div class="grid-4" style="margin-bottom: 24px">
      <div class="card stat-card">
        <p class="stat-label">Einnahmen</p>
        <p class="stat-value positive">{chf(income)}</p>
        <p class="stat-sub">{transactions.filter((t) => t.type === 'income').length} Einträge</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">Ausgaben</p>
        <p class="stat-value negative">{chf(expenses)}</p>
        <p class="stat-sub">{transactions.filter((t) => t.type === 'expense').length} Einträge</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">Saldo</p>
        <p class="stat-value" class:positive={balance >= 0} class:negative={balance < 0}>{chf(balance)}</p>
        <p class="stat-sub">Verfügbar</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">Budgetstatus</p>
        <p class="stat-value" class:negative={exceededCount > 0} class:positive={exceededCount === 0 && budgets.length > 0} class:muted={budgets.length === 0}>
          {#if budgets.length === 0}Kein Budget{:else if exceededCount > 0}{exceededCount} überschritten{:else}Alles OK ✓{/if}
        </p>
        <p class="stat-sub">{budgets.length} Budgets</p>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="dashboard-grid">
      <!-- Recent Transactions -->
      <div class="card">
        <div class="section-head">
          <h2>Letzte Transaktionen</h2>
          <a href="/transactions" class="link-more">Alle →</a>
        </div>

        {#if recent.length === 0}
          <div class="empty-state">
            <p>Noch keine Transaktionen erfasst.</p>
            <a href="/transactions" class="btn btn-primary btn-sm">Erste erfassen</a>
          </div>
        {:else}
          <div class="tx-list">
            {#each recent as tx}
              <div class="tx-row">
                <div class="tx-icon" class:tx-in={tx.type === 'income'} class:tx-out={tx.type === 'expense'}>
                  {tx.type === 'income' ? '↑' : '↓'}
                </div>
                <div class="tx-body">
                  <span class="tx-title">{tx.title}</span>
                  <span class="tx-meta">{tx.category} · {fmtDate(tx.date)}</span>
                </div>
                <span class="tx-amount" class:positive={tx.type === 'income'} class:negative={tx.type === 'expense'}>
                  {tx.type === 'income' ? '+' : '−'}{chf(tx.amount)}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Budget Overview -->
      <div class="card">
        <div class="section-head">
          <h2>Budget-Überblick</h2>
          <a href="/budgets" class="link-more">Verwalten →</a>
        </div>

        {#if budgets.length === 0}
          <div class="empty-state">
            <p>Noch keine Budgets angelegt.</p>
            <a href="/budgets" class="btn btn-primary btn-sm">Budget erstellen</a>
          </div>
        {:else}
          <div class="budget-list">
            {#each budgets as b}
              {@const spent = spentFor(b.category)}
              {@const pct = budgetPercent(b)}
              <div class="budget-item">
                <div class="budget-row">
                  <span class="budget-cat">{b.category}</span>
                  <span class="budget-nums">
                    <span class={amountClass(pct)}>{chf(spent)}</span>
                    <span class="muted"> / {chf(b.limit)}</span>
                  </span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar {progressClass(pct)}" style="width:{pct}%"></div>
                </div>
                <div class="budget-footer">
                  {#if pct >= 100}
                    <span class="badge badge-red">Überschritten</span>
                  {:else if pct >= 80}
                    <span class="badge badge-orange">{pct}% verbraucht</span>
                  {:else}
                    <span class="badge badge-green">{pct}% verbraucht</span>
                  {/if}
                  <span class="muted" style="font-size:0.78rem">{chf(Math.max(b.limit - spent, 0))} übrig</span>
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
  .page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }

  .eyebrow {
    color: var(--primary);
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 4px;
  }

  h1 {
    margin: 0;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 20px;
  }

  .stat-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
    margin: 0;
  }

  .stat-value {
    font-size: 1.55rem;
    font-weight: 800;
    line-height: 1.15;
    margin: 6px 0 2px;
  }

  .stat-sub {
    font-size: 0.78rem;
    color: var(--text-3);
    margin: 0;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .section-head h2 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
  }

  .link-more {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--primary);
  }

  .tx-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tx-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: var(--radius-sm);
    background: var(--surface-soft);
    transition: background 0.15s;
  }

  .tx-row:hover {
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
    gap: 1px;
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

  .tx-amount {
    font-size: 0.88rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .budget-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .budget-item {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .budget-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .budget-cat {
    font-size: 0.88rem;
    font-weight: 600;
  }

  .budget-nums {
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .budget-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  @media (max-width: 900px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .page-header .btn {
      width: 100%;
    }
  }
</style>
