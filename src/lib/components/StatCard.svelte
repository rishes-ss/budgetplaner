<script>
  /** @type {'positive' | 'negative' | 'warning' | 'neutral'} */
  export let color = 'neutral';
  export let label = '';
  export let value = '';
  export let sub = '';
  /** optional: '+12%' oder '-5 CHF' als Trendtext */
  export let trend = '';
  /** optional: 'up' | 'down' | 'neutral' */
  export let trendDir = 'neutral';
</script>

<div class="stat-card card" data-color={color}>
  <div class="top">
    <span class="label">{label}</span>
    <div class="icon-slot">
      <slot name="icon" />
    </div>
  </div>

  <p class="value">{value}</p>

  <div class="bottom">
    {#if sub}
      <span class="sub muted">{sub}</span>
    {/if}
    {#if trend}
      <span class="trend" data-dir={trendDir}>
        {#if trendDir === 'up'}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
        {:else if trendDir === 'down'}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        {/if}
        {trend}
      </span>
    {/if}
  </div>
</div>

<style>
  .stat-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 20px;
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.2s, transform 0.2s;
  }

  .stat-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  /* colour accent strip on left edge */
  .stat-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 10px 0 0 10px;
    background: var(--border);
  }

  .stat-card[data-color='positive']::before { background: var(--green); }
  .stat-card[data-color='negative']::before { background: var(--red); }
  .stat-card[data-color='warning']::before  { background: var(--orange); }
  .stat-card[data-color='neutral']::before  { background: var(--primary); }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .label {
    font-size: 0.73rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-3);
  }

  .icon-slot {
    color: var(--text-3);
    display: flex;
    align-items: center;
  }

  .value {
    font-size: 1.65rem;
    font-weight: 800;
    line-height: 1.1;
    margin: 8px 0 4px;
    color: var(--text);
  }

  .stat-card[data-color='positive'] .value { color: var(--green); }
  .stat-card[data-color='negative'] .value { color: var(--red); }
  .stat-card[data-color='warning']  .value { color: var(--orange); }
  .stat-card[data-color='neutral']  .value { color: var(--text); }

  .bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .sub {
    font-size: 0.77rem;
  }

  .trend {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 100px;
  }

  .trend[data-dir='up'] {
    background: var(--green-bg);
    color: var(--green);
  }

  .trend[data-dir='down'] {
    background: var(--red-bg);
    color: var(--red);
  }

  .trend[data-dir='neutral'] {
    background: var(--surface-soft);
    color: var(--text-3);
  }
</style>
