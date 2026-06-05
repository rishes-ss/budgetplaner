<script>
  import { enhance } from '$app/forms';
  export let data;
  export let form;

  let editing = null;
  let contributingId = null;

  $: notice = form?.success ?? null;
  $: formErrors = form?.errors ?? {};

  $: if (form?.success) {
    editing = null;
    contributingId = null;
  }

  function startEdit(goal) {
    editing = { ...goal };
  }

  function cancelEdit() {
    editing = null;
  }

  function pct(goal) {
    if (!goal.targetAmount) return 0;
    return Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
  }

  function daysLeft(deadline) {
    if (!deadline) return null;
    const diff = new Date(deadline) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function chf(v) {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(v);
  }

  function fmtDeadline(d) {
    return new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const totalSaved = (goals) => goals.reduce((s, g) => s + (g.savedAmount || 0), 0);
  const totalTarget = (goals) => goals.reduce((s, g) => s + (g.targetAmount || 0), 0);
</script>

<svelte:head>
  <title>Sparziele – BudgetPlaner</title>
</svelte:head>

<div class="page">
  <div class="shell">
    <div class="page-header">
      <h1>Sparziele</h1>
    </div>

    {#if notice}
      <div class="notice notice-success">{notice}</div>
    {/if}

    <!-- Summary -->
    {#if data.goals.length > 0}
      <div class="summary-row" style="margin-bottom: 24px">
        <div class="summary-card">
          <span class="summary-label">Gesamt gespart</span>
          <span class="summary-val positive">{chf(totalSaved(data.goals))}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Gesamtziel</span>
          <span class="summary-val">{chf(totalTarget(data.goals))}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Noch offen</span>
          <span class="summary-val {totalTarget(data.goals) - totalSaved(data.goals) > 0 ? 'warning' : 'positive'}">
            {chf(Math.max(totalTarget(data.goals) - totalSaved(data.goals), 0))}
          </span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Ziele erreicht</span>
          <span class="summary-val positive">
            {data.goals.filter((g) => g.savedAmount >= g.targetAmount).length} / {data.goals.length}
          </span>
        </div>
      </div>
    {/if}

    <div class="grid-split">
      <!-- Form Panel -->
      <div class="card">
        <h2 style="margin-bottom: 18px">{editing ? 'Ziel bearbeiten' : 'Neues Sparziel'}</h2>

        {#if editing}
          <form method="POST" action="?/update" use:enhance class="goal-form">
            <input type="hidden" name="id" value={editing._id} />
            <div class="form-group">
              <label for="edit-name">Name</label>
              <input id="edit-name" name="name" type="text" value={editing.name} required placeholder="z.B. Urlaubskasse" />
              {#if formErrors.name}<span class="error-msg">{formErrors.name}</span>{/if}
            </div>
            <div class="form-group">
              <label for="edit-target">Zielbetrag (CHF)</label>
              <input id="edit-target" name="targetAmount" type="number" min="1" step="any" value={editing.targetAmount} required />
              {#if formErrors.targetAmount}<span class="error-msg">{formErrors.targetAmount}</span>{/if}
            </div>
            <div class="form-group">
              <label for="edit-deadline">Zieldatum (optional)</label>
              <input id="edit-deadline" name="deadline" type="date" value={editing.deadline ?? ''} min={today} />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Speichern</button>
              <button type="button" class="btn" on:click={cancelEdit}>Abbrechen</button>
            </div>
          </form>
        {:else}
          <form method="POST" action="?/create" use:enhance class="goal-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input id="name" name="name" type="text" required placeholder="z.B. Urlaubskasse, Notfallfonds" />
              {#if formErrors.name}<span class="error-msg">{formErrors.name}</span>{/if}
            </div>
            <div class="form-group">
              <label for="targetAmount">Zielbetrag (CHF)</label>
              <input id="targetAmount" name="targetAmount" type="number" min="1" step="any" required placeholder="z.B. 2000" />
              {#if formErrors.targetAmount}<span class="error-msg">{formErrors.targetAmount}</span>{/if}
            </div>
            <div class="form-group">
              <label for="deadline">Zieldatum (optional)</label>
              <input id="deadline" name="deadline" type="date" min={today} />
            </div>
            <button type="submit" class="btn btn-primary btn-block">Sparziel anlegen</button>
          </form>
        {/if}
      </div>

      <!-- Goals List -->
      <div>
        {#if data.goals.length === 0}
          <div class="card empty-state">
            <p>Noch keine Sparziele angelegt.</p>
            <p class="muted" style="font-size:0.88rem">Erstelle dein erstes Ziel im Formular links.</p>
          </div>
        {:else}
          <div class="goals-list">
            {#each data.goals as goal}
              {@const p = pct(goal)}
              {@const done = goal.savedAmount >= goal.targetAmount}
              {@const days = daysLeft(goal.deadline)}

              <div class="card goal-card" class:done>
                <div class="goal-head">
                  <div class="goal-title-row">
                    <h3 class="goal-name">{goal.name}</h3>
                    {#if done}
                      <span class="badge badge-green">Erreicht!</span>
                    {:else if days !== null && days <= 30}
                      <span class="badge badge-orange">{days}d übrig</span>
                    {:else if days !== null}
                      <span class="badge badge-green">{days}d übrig</span>
                    {/if}
                  </div>
                  <div class="goal-actions">
                    <button class="btn btn-ghost btn-sm" on:click={() => startEdit(goal)} title="Bearbeiten">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <form method="POST" action="?/delete" use:enhance style="display:inline">
                      <input type="hidden" name="id" value={goal._id} />
                      <button
                        type="submit"
                        class="btn btn-ghost btn-sm btn-danger"
                        title="Löschen"
                        on:click={(e) => { if (!confirm('Sparziel löschen?')) e.preventDefault(); }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </form>
                  </div>
                </div>

                <div class="goal-amounts">
                  <div class="amount-block">
                    <span class="amount-label">Gespart</span>
                    <span class="amount-val positive">{chf(goal.savedAmount)}</span>
                  </div>
                  <div class="amount-sep">/</div>
                  <div class="amount-block">
                    <span class="amount-label">Ziel</span>
                    <span class="amount-val">{chf(goal.targetAmount)}</span>
                  </div>
                  <div class="amount-block remaining">
                    <span class="amount-label">Fehlt noch</span>
                    <span class="amount-val {done ? 'positive' : 'warning'}">
                      {chf(Math.max(goal.targetAmount - goal.savedAmount, 0))}
                    </span>
                  </div>
                </div>

                <div class="progress-track" style="height: 10px">
                  <div
                    class="progress-bar"
                    class:good={p < 80}
                    class:warn={p >= 80 && p < 100}
                    class:done-bar={p >= 100}
                    style="width:{p}%"
                  ></div>
                </div>
                <p class="pct-label muted">{p}% erreicht{goal.deadline ? ' · Bis ' + fmtDeadline(goal.deadline) : ''}</p>

                <!-- Contribution form -->
                {#if contributingId === goal._id}
                  <form method="POST" action="?/contribute" use:enhance class="contribute-form">
                    <input type="hidden" name="id" value={goal._id} />
                    <div class="contribute-row">
                      <input
                        name="amount"
                        type="number"
                        min="0.01"
                        step="any"
                        placeholder="Betrag CHF"
                        class="contribute-input"
                        required
                      />
                      <button type="submit" class="btn btn-primary btn-sm">Einzahlen</button>
                      <button type="button" class="btn btn-sm" on:click={() => (contributingId = null)}>✕</button>
                    </div>
                    {#if form?.errors?.contribution && form?.id === goal._id}
                      <span class="error-msg">{form.errors.contribution}</span>
                    {/if}
                  </form>
                {:else if !done}
                  <button class="btn btn-ghost btn-sm contribute-btn" on:click={() => (contributingId = goal._id)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Einzahlung
                  </button>
                {/if}
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
    margin-bottom: 24px;
  }

  .summary-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .summary-card {
    background: var(--surface-soft);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .summary-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
  }

  .summary-val {
    font-size: 1.1rem;
    font-weight: 800;
  }

  .goal-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .form-actions {
    display: flex;
    gap: 10px;
  }

  .goals-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .goal-card {
    transition: border-color 0.15s;
  }

  .goal-card.done {
    border-color: var(--green-border);
    background: linear-gradient(135deg, var(--surface), var(--green-bg));
  }

  .goal-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
    gap: 8px;
  }

  .goal-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .goal-name {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
  }

  .goal-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .goal-amounts {
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

  .progress-bar.good { background: var(--primary); }
  .progress-bar.warn { background: var(--orange); }
  .progress-bar.done-bar { background: var(--green); }

  .contribute-form {
    margin-top: 12px;
  }

  .contribute-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .contribute-input {
    flex: 1;
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    font-size: 0.88rem;
    min-width: 0;
  }

  .contribute-btn {
    margin-top: 10px;
    font-size: 0.82rem;
  }

  @media (max-width: 700px) {
    .summary-row {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 480px) {
    .summary-row {
      grid-template-columns: 1fr;
    }
  }
</style>
