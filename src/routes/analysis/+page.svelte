<script>
  export let data;

  $: tx = data.transactions;
  $: budgets = data.budgets;

  $: income = tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  $: expenses = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  $: balance = income - expenses;
  $: savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

  // Spending by category
  $: byCategory = (() => {
    const map = {};
    tx.filter((t) => t.type === 'expense').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));
  })();

  // Spending by month (last 6 months)
  $: byMonth = (() => {
    const map = {};
    tx.filter((t) => t.type === 'expense').forEach((t) => {
      const key = t.date.slice(0, 7);
      map[key] = (map[key] || 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));
  })();

  $: maxCat = byCategory.length > 0 ? byCategory[0].amount : 1;
  $: maxMonth = byMonth.length > 0 ? Math.max(...byMonth.map((m) => m.amount)) : 1;

  // Budget vs actual
  $: budgetComparison = budgets.map((b) => {
    const spent = tx
      .filter((t) => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
      .reduce((s, t) => s + t.amount, 0);
    const pct = Math.min(Math.round((spent / b.limit) * 100), 100);
    return { ...b, spent, pct };
  });

  function chf(v) {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(v);
  }

  function fmtMonth(ym) {
    const [y, m] = ym.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleDateString('de-CH', { month: 'short', year: '2-digit' });
  }

  function barColor(pct) {
    if (pct >= 100) return 'danger';
    if (pct >= 80) return 'warn';
    return 'good';
  }
</script>

<svelte:head>
  <title>Analyse – BudgetPlaner</title>
</svelte:head>

<div class="page">
  <div class="shell">
    <h1 style="margin-bottom: 24px">Analyse</h1>

    <!-- KPI Row -->
    <div class="grid-4" style="margin-bottom: 28px">
      <div class="card stat-card">
        <p class="stat-label">Einnahmen</p>
        <p class="stat-value positive">{chf(income)}</p>
        <p class="stat-sub">Gesamt</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">Ausgaben</p>
        <p class="stat-value negative">{chf(expenses)}</p>
        <p class="stat-sub">Gesamt</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">Saldo</p>
        <p class="stat-value" class:positive={balance >= 0} class:negative={balance < 0}>{chf(balance)}</p>
        <p class="stat-sub">Einnahmen − Ausgaben</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">Sparquote</p>
        <p class="stat-value" class:positive={savingsRate >= 20} class:warning={savingsRate > 0 && savingsRate < 20} class:negative={savingsRate < 0}>
          {savingsRate}%
        </p>
        <p class="stat-sub">des Einkommens</p>
      </div>
    </div>

    <div class="analysis-grid">
      <!-- Spending by Category -->
      <div class="card">
        <h2 style="margin-bottom: 20px">Ausgaben nach Kategorie</h2>
        {#if byCategory.length === 0}
          <p class="empty-state">Keine Ausgaben vorhanden.</p>
        {:else}
          <div class="bar-chart">
            {#each byCategory as item}
              {@const width = Math.round((item.amount / maxCat) * 100)}
              <div class="bar-row">
                <span class="bar-label">{item.category}</span>
                <div class="bar-track">
                  <div class="bar-fill" style="width:{width}%"></div>
                </div>
                <span class="bar-value negative">{chf(item.amount)}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Monthly Spending -->
      <div class="card">
        <h2 style="margin-bottom: 20px">Ausgaben nach Monat</h2>
        {#if byMonth.length === 0}
          <p class="empty-state">Keine Daten vorhanden.</p>
        {:else}
          <div class="month-chart">
            {#each byMonth as item}
              {@const height = Math.round((item.amount / maxMonth) * 100)}
              <div class="month-col">
                <span class="month-val">{chf(item.amount)}</span>
                <div class="month-bar-track">
                  <div class="month-bar" style="height:{height}%"></div>
                </div>
                <span class="month-label">{fmtMonth(item.month)}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Budget vs Actual -->
      {#if budgetComparison.length > 0}
        <div class="card full-width">
          <h2 style="margin-bottom: 20px">Budget vs. tatsächliche Ausgaben</h2>
          <div class="budget-table">
            <div class="bt-header">
              <span>Kategorie</span>
              <span>Budget</span>
              <span>Ausgegeben</span>
              <span>Übrig</span>
              <span>Status</span>
            </div>
            {#each budgetComparison as b}
              <div class="bt-row">
                <span class="bt-cat">{b.category}</span>
                <span>{chf(b.limit)}</span>
                <span class:negative={b.pct >= 100} class:warning={b.pct >= 80 && b.pct < 100} class:positive={b.pct < 80}>
                  {chf(b.spent)}
                </span>
                <span class:negative={b.spent > b.limit} class:positive={b.spent <= b.limit}>
                  {chf(Math.max(b.limit - b.spent, 0))}
                </span>
                <span>
                  {#if b.pct >= 100}
                    <span class="badge badge-red">Überschritten</span>
                  {:else if b.pct >= 80}
                    <span class="badge badge-orange">{b.pct}%</span>
                  {:else}
                    <span class="badge badge-green">{b.pct}%</span>
                  {/if}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Top Transactions -->
      <div class="card">
        <h2 style="margin-bottom: 16px">Top Ausgaben</h2>
        {#if tx.filter((t) => t.type === 'expense').length === 0}
          <p class="empty-state">Keine Ausgaben vorhanden.</p>
        {:else}
          <div class="top-list">
            {#each tx.filter((t) => t.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 8) as t}
              <div class="top-row">
                <div class="top-info">
                  <span class="top-title">{t.title}</span>
                  <span class="top-meta muted">{t.category}</span>
                </div>
                <span class="negative" style="font-weight: 700">{chf(t.amount)}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .stat-card {
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
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1.15;
    margin: 6px 0 2px;
  }

  .stat-sub {
    font-size: 0.78rem;
    color: var(--text-3);
    margin: 0;
  }

  .analysis-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .full-width {
    grid-column: 1 / -1;
  }

  /* Bar chart */
  .bar-chart {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .bar-row {
    display: grid;
    grid-template-columns: 120px 1fr 100px;
    align-items: center;
    gap: 12px;
  }

  .bar-label {
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-track {
    height: 10px;
    border-radius: 100px;
    background: var(--border-soft);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: inherit;
    background: var(--red);
    transition: width 0.4s ease;
  }

  .bar-value {
    font-size: 0.85rem;
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
  }

  /* Month chart */
  .month-chart {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    height: 180px;
    padding-bottom: 30px;
    position: relative;
  }

  .month-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    height: 100%;
    justify-content: flex-end;
    position: relative;
  }

  .month-val {
    font-size: 0.62rem;
    font-weight: 600;
    color: var(--text-3);
    white-space: nowrap;
    position: absolute;
    bottom: 30px;
    transform: translateY(-100%) translateY(-4px);
    writing-mode: vertical-rl;
    display: none;
  }

  .month-bar-track {
    width: 100%;
    height: 130px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    border-radius: 4px 4px 0 0;
    overflow: hidden;
    background: var(--border-soft);
  }

  .month-bar {
    width: 100%;
    background: var(--primary);
    border-radius: 4px 4px 0 0;
    transition: height 0.4s ease;
    min-height: 4px;
  }

  .month-label {
    position: absolute;
    bottom: 0;
    font-size: 0.72rem;
    color: var(--text-3);
    white-space: nowrap;
  }

  /* Budget table */
  .budget-table {
    display: grid;
    gap: 0;
  }

  .bt-header,
  .bt-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    gap: 12px;
    padding: 10px 12px;
    font-size: 0.85rem;
    align-items: center;
  }

  .bt-header {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-3);
    border-bottom: 1px solid var(--border-soft);
  }

  .bt-row {
    border-bottom: 1px solid var(--border-soft);
    transition: background 0.15s;
  }

  .bt-row:last-child {
    border-bottom: none;
  }

  .bt-row:hover {
    background: var(--surface-soft);
  }

  .bt-cat {
    font-weight: 600;
  }

  /* Top list */
  .top-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    background: var(--surface-soft);
  }

  .top-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .top-title {
    font-size: 0.88rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .top-meta {
    font-size: 0.74rem;
  }

  @media (max-width: 900px) {
    .analysis-grid {
      grid-template-columns: 1fr;
    }

    .full-width {
      grid-column: 1;
    }

    .bt-header,
    .bt-row {
      grid-template-columns: 1.5fr 1fr 1fr 1fr;
    }

    .bt-header span:last-child,
    .bt-row span:last-child {
      display: none;
    }
  }

  @media (max-width: 600px) {
    .bar-row {
      grid-template-columns: 90px 1fr 80px;
    }

    .bt-header,
    .bt-row {
      grid-template-columns: 1.5fr 1fr 1fr;
    }

    .bt-header span:nth-child(4),
    .bt-row span:nth-child(4) {
      display: none;
    }
  }
</style>
