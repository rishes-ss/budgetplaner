<script>
  import StatCard from '$lib/components/StatCard.svelte';

  export let data;

  $: tx = data.transactions;
  $: budgets = data.budgets;

  // ── View toggle ───────────────────────────────────────────────────
  let viewMode = 'total';
  $: currentYM = new Date().toISOString().slice(0, 7);
  let selectedMonth = new Date().toISOString().slice(0, 7);

  $: availableMonths = [...new Set(tx.map((t) => t.date.slice(0, 7)))].sort().reverse();

  $: filteredTx = viewMode === 'monthly'
    ? tx.filter((t) => t.date.slice(0, 7) === selectedMonth)
    : tx;

  $: subLabel = viewMode === 'monthly' ? fmtMonthFull(selectedMonth) : 'Gesamt';

  // ── KPI ───────────────────────────────────────────────────────────
  $: income = filteredTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  $: expenses = filteredTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  $: balance = income - expenses;
  $: savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

  // ── Category bar chart ────────────────────────────────────────────
  $: byCategory = (() => {
    const map = {};
    filteredTx.filter((t) => t.type === 'expense').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));
  })();

  // ── Monthly comparison (always all data) ─────────────────────────
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

  // ── Budget vs actual ──────────────────────────────────────────────
  $: budgetComparison = budgets.map((b) => {
    const spent = filteredTx
      .filter((t) => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
      .reduce((s, t) => s + t.amount, 0);
    const effective = (b.limit || 0) + (b.rolloverAmount || 0);
    const pct = effective > 0 ? Math.min(Math.round((spent / effective) * 100), 100) : 0;
    return { ...b, spent, pct, effective };
  });

  // ── Donut chart ───────────────────────────────────────────────────
  const PALETTE = ['#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

  $: donutMonth = viewMode === 'monthly' ? selectedMonth : currentYM;
  $: donutTx = tx.filter((t) => t.date.slice(0, 7) === donutMonth);
  $: donutIncome = donutTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  $: donutExpenses = donutTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function donutSector(cx, cy, ro, ri, a1, a2) {
    const span = Math.min(a2 - a1, 359.99);
    const p1 = polarToCartesian(cx, cy, ro, a1);
    const p2 = polarToCartesian(cx, cy, ro, a1 + span);
    const p3 = polarToCartesian(cx, cy, ri, a1 + span);
    const p4 = polarToCartesian(cx, cy, ri, a1);
    const large = span > 180 ? 1 : 0;
    return `M${p1[0].toFixed(2)} ${p1[1].toFixed(2)} A${ro} ${ro} 0 ${large} 1 ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} L${p3[0].toFixed(2)} ${p3[1].toFixed(2)} A${ri} ${ri} 0 ${large} 0 ${p4[0].toFixed(2)} ${p4[1].toFixed(2)}Z`;
  }

  $: pieSegments = (() => {
    if (donutIncome === 0 && donutExpenses === 0) return [];
    const map = {};
    donutTx.filter((t) => t.type === 'expense').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    const items = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt], i) => ({ category: cat, amount: amt, color: PALETTE[i % PALETTE.length] }));
    const unspent = donutIncome - donutExpenses;
    if (unspent > 0) items.push({ category: 'Nicht ausgegeben', amount: unspent, color: '#10b981' });
    const total = items.reduce((s, d) => s + d.amount, 0);
    if (total === 0) return [];
    let cum = 0;
    return items.map((item) => {
      const angle = (item.amount / total) * 360;
      const seg = { ...item, pct: Math.round((item.amount / total) * 100), path: donutSector(80, 80, 68, 40, cum, cum + angle) };
      cum += angle;
      return seg;
    });
  })();

  $: donutLabel = fmtMonthFull(donutMonth);

  // ── Helpers ───────────────────────────────────────────────────────
  function chf(v) {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(v);
  }

  function fmtMonth(ym) {
    const [y, m] = ym.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('de-CH', { month: 'short', year: '2-digit' });
  }

  function fmtMonthFull(ym) {
    const [y, m] = ym.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
  }

  function compact(v) {
    const abs = Math.abs(v);
    const sign = v < 0 ? '−' : '';
    if (abs >= 1000) return sign + (abs / 1000).toFixed(1).replace('.0', '') + 'K';
    return sign + Math.round(abs).toString();
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

    <!-- Header + Toggle -->
    <div class="page-header">
      <h1>Analyse</h1>
      <div class="view-toggle">
        <button
          class="toggle-btn"
          class:active={viewMode === 'total'}
          on:click={() => (viewMode = 'total')}
        >Gesamt</button>
        <button
          class="toggle-btn"
          class:active={viewMode === 'monthly'}
          on:click={() => (viewMode = 'monthly')}
        >Pro Monat</button>
        {#if viewMode === 'monthly'}
          <select class="month-select" bind:value={selectedMonth}>
            {#each availableMonths as m}
              <option value={m}>{fmtMonthFull(m)}</option>
            {/each}
          </select>
        {/if}
      </div>
    </div>

    <!-- KPI Row -->
    <div class="grid-4" style="margin-bottom: 28px">
      <StatCard label="Einnahmen" value={chf(income)} sub={subLabel} color="positive">
        <svelte:fragment slot="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </svelte:fragment>
      </StatCard>

      <StatCard label="Ausgaben" value={chf(expenses)} sub={subLabel} color="negative">
        <svelte:fragment slot="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
        </svelte:fragment>
      </StatCard>

      <StatCard label="Saldo" value={chf(balance)} sub="Einnahmen − Ausgaben" color={balance >= 0 ? 'positive' : 'negative'}>
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

      <!-- Category bar chart -->
      <div class="card">
        <h2 style="margin-bottom: 20px">Ausgaben nach Kategorie</h2>
        {#if byCategory.length === 0}
          <p class="empty-state">Keine Ausgaben vorhanden.</p>
        {:else}
          <div class="bar-chart">
            {#each byCategory as item, i}
              {@const width = Math.round((item.amount / maxCat) * 100)}
              {@const color = PALETTE[i % PALETTE.length]}
              <div class="bar-row">
                <div class="bar-label-wrap">
                  <span class="bar-dot" style="background:{color}"></span>
                  <span class="bar-label">{item.category}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style="width:{width}%; background:{color}"></div>
                </div>
                <span class="bar-value">{chf(item.amount)}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Donut chart -->
      <div class="card">
        <h2 style="margin-bottom: 4px">Verteilung – {donutLabel}</h2>
        {#if pieSegments.length === 0}
          <p class="empty-state" style="margin-top:16px">Keine Daten für diesen Monat.</p>
        {:else}
          <div class="donut-wrapper">
            <div class="donut-chart-wrap">
              <svg viewBox="0 0 160 160" class="donut-svg">
                {#each pieSegments as seg}
                  <path d={seg.path} fill={seg.color} stroke="var(--surface)" stroke-width="2" />
                {/each}
                <text x="80" y="74" class="donut-center-line1" text-anchor="middle">Ausgaben</text>
                <text x="80" y="92" class="donut-center-line2" text-anchor="middle">
                  {pieSegments.filter(s => s.category !== 'Nicht ausgegeben').reduce((a, s) => a + s.pct, 0)}%
                </text>
              </svg>
            </div>
            <div class="donut-legend">
              {#each pieSegments as seg}
                <div class="donut-legend-row">
                  <span class="donut-dot" style="background:{seg.color}"></span>
                  <span class="donut-cat">{seg.category}</span>
                  <span class="donut-pct" style="color:{seg.color}">{seg.pct}%</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Monthly Comparison (always all data) -->
      <div class="card full-width">
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
              <div
                class="compare-col"
                class:highlighted={item.month === (viewMode === 'monthly' ? selectedMonth : currentYM)}
              >
                <div class="bar-values-row">
                  <span class="bv bv-income">{compact(item.income)}</span>
                  <span class="bv bv-expense">{compact(item.expenses)}</span>
                </div>
                <div class="bar-pair">
                  <div class="bar-wrap">
                    <div class="cbar income-bar" style="height:{incomeH}%"></div>
                  </div>
                  <div class="bar-wrap">
                    <div class="cbar expense-bar" style="height:{expenseH}%"></div>
                  </div>
                </div>
                <span class="compare-label">{fmtMonth(item.month)}</span>
                <span class="compare-balance" class:pos={item.balance >= 0} class:neg={item.balance < 0}>
                  {item.balance >= 0 ? '+' : ''}{compact(item.balance)}
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
        {#if filteredTx.filter((t) => t.type === 'expense').length === 0}
          <p class="empty-state">Keine Ausgaben vorhanden.</p>
        {:else}
          <div class="top-list">
            {#each filteredTx.filter((t) => t.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 8) as t}
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
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;
  }

  .page-header h1 { margin: 0; }

  .view-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--surface-soft);
    padding: 4px;
    border-radius: var(--radius);
  }

  .toggle-btn {
    padding: 6px 16px;
    border-radius: calc(var(--radius) - 2px);
    border: none;
    background: transparent;
    color: var(--text-2);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .toggle-btn.active {
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  }

  .month-select {
    margin-left: 4px;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-soft);
    background: var(--surface);
    color: var(--text);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }

  .analysis-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .full-width {
    grid-column: 1 / -1;
  }

  /* ── Category bar chart ── */
  .bar-chart {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .bar-row {
    display: grid;
    grid-template-columns: 130px 1fr 110px;
    align-items: center;
    gap: 12px;
  }

  .bar-label-wrap {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }

  .bar-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .bar-label {
    font-size: 0.84rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-track {
    height: 6px;
    border-radius: 100px;
    background: var(--border-soft);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: inherit;
    transition: width 0.5s ease;
  }

  .bar-value {
    font-size: 0.82rem;
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
    color: var(--text);
  }

  /* ── Donut chart ── */
  .donut-wrapper {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 8px;
  }

  .donut-chart-wrap {
    flex-shrink: 0;
    width: 160px;
    height: 160px;
  }

  .donut-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .donut-center-line1 {
    font-size: 10px;
    fill: var(--text-3);
    font-family: inherit;
  }

  .donut-center-line2 {
    font-size: 18px;
    font-weight: 700;
    fill: var(--text);
    font-family: inherit;
  }

  .donut-legend {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .donut-legend-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .donut-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .donut-cat {
    flex: 1;
    font-size: 0.82rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .donut-pct {
    font-size: 0.82rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  /* ── Monthly comparison ── */
  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .chart-header h2 { margin: 0; }

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
    gap: 8px;
    align-items: flex-end;
  }

  .compare-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    min-width: 0;
    border-radius: var(--radius-sm);
    padding: 4px 2px;
    transition: background 0.15s;
  }

  .compare-col.highlighted {
    background: var(--surface-soft);
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  .bar-values-row {
    display: flex;
    justify-content: center;
    gap: 2px;
    width: 100%;
  }

  .bv {
    font-size: 0.58rem;
    font-weight: 700;
    flex: 1;
    text-align: center;
    white-space: nowrap;
  }

  .bv-income { color: var(--green); }
  .bv-expense { color: var(--red); }

  .bar-pair {
    display: flex;
    gap: 3px;
    align-items: flex-end;
    height: 120px;
    width: 100%;
    justify-content: center;
  }

  .bar-wrap {
    width: 10px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
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
    font-size: 0.65rem;
    color: var(--text-3);
    white-space: nowrap;
    text-align: center;
  }

  .compare-balance {
    font-size: 0.62rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .compare-balance.pos { color: var(--green); }
  .compare-balance.neg { color: var(--red); }

  /* ── Budget table ── */
  .budget-table { display: grid; gap: 0; }

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

  .bt-row:last-child { border-bottom: none; }
  .bt-row:hover { background: var(--surface-soft); }

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

  /* ── Top list ── */
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

  .top-meta { font-size: 0.74rem; }

  @media (max-width: 900px) {
    .analysis-grid { grid-template-columns: 1fr; }
    .full-width { grid-column: 1; }

    .bt-header,
    .bt-row {
      grid-template-columns: 1.5fr 1fr 1fr 1fr;
    }

    .bt-header span:last-child,
    .bt-row span:last-child { display: none; }

    .donut-wrapper { flex-direction: column; align-items: flex-start; }
    .donut-chart-wrap { width: 140px; height: 140px; }
  }

  @media (max-width: 600px) {
    .page-header { flex-direction: column; align-items: flex-start; }
    .bar-row { grid-template-columns: 100px 1fr 90px; }

    .bt-header,
    .bt-row { grid-template-columns: 1.5fr 1fr 1fr; }

    .bt-header span:nth-child(4),
    .bt-row span:nth-child(4) { display: none; }
  }
</style>
