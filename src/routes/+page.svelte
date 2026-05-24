<script>
  import StatCard from '$lib/components/StatCard.svelte';

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
      <StatCard
        label="Einnahmen"
        value={chf(income)}
        sub="{transactions.filter((t) => t.type === 'income').length} Einträge"
        color="positive"
        trend={transactions.filter((t) => t.type === 'income').length > 0 ? '+' + transactions.filter((t) => t.type === 'income').length : ''}
        trendDir="up"
      >
        <svelte:fragment slot="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </svelte:fragment>
      </StatCard>

      <StatCard
        label="Ausgaben"
        value={chf(expenses)}
        sub="{transactions.filter((t) => t.type === 'expense').length} Einträge"
        color="negative"
        trend={transactions.filter((t) => t.type === 'expense').length > 0 ? transactions.filter((t) => t.type === 'expense').length + ' Posten' : ''}
        trendDir="down"
      >
        <svelte:fragment slot="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
        </svelte:fragment>
      </StatCard>

      <StatCard
        label="Saldo"
        value={chf(balance)}
        sub="Verfügbar"
        color={balance >= 0 ? 'positive' : 'negative'}
        trend={balance >= 0 ? 'Positiv' : 'Negativ'}
        trendDir={balance >= 0 ? 'up' : 'down'}
      >
        <svelte:fragment slot="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </svelte:fragment>
      </StatCard>

      <StatCard
        label="Budgetstatus"
        value={budgets.length === 0 ? 'Kein Budget' : exceededCount > 0 ? exceededCount + ' überschritten' : 'Alles OK ✓'}
        sub="{budgets.length} Budgets"
        color={budgets.length === 0 ? 'neutral' : exceededCount > 0 ? 'negative' : 'positive'}
        trend={budgets.length > 0 ? (exceededCount > 0 ? 'Achtung' : 'Im Rahmen') : ''}
        trendDir={exceededCount > 0 ? 'down' : 'up'}
      >
        <svelte:fragment slot="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </svelte:fragment>
      </StatCard>
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
