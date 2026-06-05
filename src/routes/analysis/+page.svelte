<script>
  import StatCard from '$lib/components/StatCard.svelte';

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

  // Monthly comparison: income vs expenses for last 12 months
  $: byMonthCompare = (() => {
    const map = {};
    tx.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (!map[key]) map[key] = { income: 0, expenses: 0 };
      if (t.type === 'income') map[key].income += t.amount;
      else map[key].expenses += t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, d]) => ({ month, income: d.income, expenses: d.expenses, balance: d.income - d.expenses }));
  })();

  $: maxCat = byCategory.length > 0 ? byCategory[0].amount : 1;
  $: maxMonthVal = byMonthCompare.length > 0
    ? Math.max(...byMonthCompare.map((m) => Math.max(m.income, m.expenses)))
    : 1;

  // Budget vs actual
  $: budgetComparison = budgets.map((b) => {
    const spent = tx
      .filter((t) => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
      .reduce((s, t) => s + t.amount, 0);
    const effective = (b.limit || 0) + (b.rolloverAmount || 0);
    const pct = effective > 0 ? Math.min(Math.round((spent / effective) * 100), 100) : 0;
    return { ...b, spent, pct, effective };
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
      <StatCard
        label="Einnahmen"
        value={chf(income)}
        sub="Gesamt"
        color="positive"
      >
        <svelte:fragment slot="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </svelte:fragment>
      </StatCard>

      <StatCard
        label="Ausgaben"
        value={chf(expenses)}
        sub="Gesamt"
        color="negative"
      >
        <svelte:fragment slot="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
        </svelte:fragment>
      </StatCard>

      <StatCard
        label="Saldo"
        value={chf(balance)}
        sub="Einnahmen − Ausgaben"
        color={balance >= 0 ? 'positive' : 'negative'}
      >
        <svelte:fragment slot="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </svelte:fragment>
      </StatCard>

      <StatCard
        label="Sparquote"
        value="{savingsRate}%"
        sub="des Einkommens"
        color={savingsRate >= 20 ? 'positive' : savingsRate > 0 ? 'warning' : 'negative'}
        trend={savingsRate >= 20 ? 'Sehr gut' : savingsRate > 0 ? 'Ausbaufähig' : 'Negativ'}
        trendDir={savingsRate >= 20 ? 'up' : savingsRate > 0 ? 'neutral' : 'down'}
      >
        <svelte:fragment slot="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M22 2l-5 5"/><path d="M17 2h5v5"/></svg>
        </svelte:fragment>
      </StatCard>
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

      <!-- Monthly Comparison Chart -->
      <div class="card">
        <div class="chart-header">
          <h2>Monatsvergleich</h2>
          <div class="chart-legend">
            <span class="legend-dot income-dot"></span><span>Einnahmen</span>
            <span class="legend-dot expense-dot"></span><span>Ausgaben</span>
          </div>
        </div>
        {#if byMonthCompare.length === 0}
          <p class="empty-state">Keine Daten vorhanden.</p>
        {:else}
          <div class="compare-chart">
            {#each byMonthCompare as item}
              {@const incomeH = Math.round((item.income / maxMonthVal) * 100)}
              {@const expenseH = Math.round((item.expenses / maxMonthVal) * 100)}
              <div class="compare-col">
                <div class="bar-pair">
                  <div class="bar-wrap" title="Einnahmen: {chf(item.income)}">
                    <div class="cbar income-bar" style="height:{incomeH}%"></div>
                  </div>
                  <div class="bar-wrap" title="Ausgaben: {chf(item.expenses)}">
                    <div class="cbar expense-bar" style="height:{expenseH}%"></div>
                  </div>
                </div>
                <span class="compare-label">{fmtMonth(item.month)}</span>
                <span class="compare-balance" class:pos={item.balance >= 0} class:neg={item.balance < 0}>
                  {item.balance >= 0 ? '+' : ''}{chf(item.balance)}
                </span>
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
                <span class="bt-cat">
                  {b.category}
                  {#if b.rolloverAmount > 0}
                    <span class="rollover-note">+{chf(b.rolloverAmount)} Rollover</span>
                  {/if}
                </span>
                <span>{chf(b.effective)}</span>
                <span class:negative={b.pct >= 100} class:warning={b.pct >= 80 && b.pct < 100} class:positive={b.pct < 80}>
                  {chf(b.spent)}
                </span>
                <span class:negative={b.spent > b.effective} class:positive={b.spent <= b.effective}>
                  {chf(Math.max(b.effective - b.spent, 0))}
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

  /* Monthly comparison chart */
  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .chart-header h2 {
    margin: 0;
  }

  .chart-legend {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.78rem;
    color: var(--text-2);
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .income-dot { background: var(--green); }
  .expense-dot { background: var(--red); }

  .compare-chart {
    display: flex;
    gap: 6px;
    align-items: flex-end;
  }

  .compare-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }

  .bar-pair {
    display: flex;
    gap: 2px;
    align-items: flex-end;
    height: 130px;
    width: 100%;
  }

  .bar-wrap {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    border-radius: 3px 3px 0 0;
    overflow: hidden;
    background: var(--border-soft);
  }

  .cbar {
    width: 100%;
    border-radius: 3px 3px 0 0;
    transition: height 0.4s ease;
    min-height: 3px;
  }

  .income-bar { background: var(--green); }
  .expense-bar { background: var(--red); }

  .compare-label {
    font-size: 0.68rem;
    color: var(--text-3);
    white-space: nowrap;
    text-align: center;
  }

  .compare-balance {
    font-size: 0.65rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .compare-balance.pos { color: var(--green); }
  .compare-balance.neg { color: var(--red); }

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
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .rollover-note {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--primary);
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
