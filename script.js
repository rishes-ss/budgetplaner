const STORAGE_KEY = 'budgetplaner-prototyp';

const demoState = {
  transactions: [
    { id: 't1', title: 'Nebenjob Lohn', amount: 1250, type: 'income', category: 'Einkommen', date: '2026-05-01', note: 'Monatlicher Eingang' },
    { id: 't2', title: 'Stipendium', amount: 650, type: 'income', category: 'Einkommen', date: '2026-05-03', note: '' },
    { id: 't3', title: 'Wocheneinkauf', amount: 92, type: 'expense', category: 'Essen', date: '2026-05-06', note: 'Migros und Baeckerei' },
    { id: 't4', title: 'ZVV Monatsabo', amount: 85, type: 'expense', category: 'Transport', date: '2026-05-07', note: '' },
    { id: 't5', title: 'Kino und Pizza', amount: 64, type: 'expense', category: 'Freizeit', date: '2026-05-10', note: 'Samstagabend' }
  ],
  budgets: [
    { id: 'b1', category: 'Essen', limit: 300 },
    { id: 'b2', category: 'Freizeit', limit: 150 },
    { id: 'b3', category: 'Transport', limit: 100 }
  ]
};

let state = loadState();
let route = normaliseRoute(window.location.pathname);
let notice = '';
let errors = {};
let editingId = null;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : cloneDemoState();
  } catch {
    return cloneDemoState();
  }
}

function cloneDemoState() {
  return JSON.parse(JSON.stringify(demoState));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normaliseRoute(path) {
  const allowed = ['/', '/transactions', '/budgets', '/analysis', '/about'];
  return allowed.includes(path) ? path : '/';
}

function formatCHF(value) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function byDateDesc(a, b) {
  return new Date(b.date) - new Date(a.date);
}

function totals() {
  const income = state.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = state.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  return { income, expenses, balance: income - expenses };
}

function spentFor(category) {
  return state.transactions
    .filter((item) => item.type === 'expense' && item.category.toLowerCase() === category.toLowerCase())
    .reduce((sum, item) => sum + item.amount, 0);
}

function biggestExpenseCategory() {
  const grouped = {};
  state.transactions
    .filter((item) => item.type === 'expense')
    .forEach((item) => {
      grouped[item.category] = (grouped[item.category] || 0) + item.amount;
    });

  const winner = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];
  return winner ? { category: winner[0], amount: winner[1] } : { category: 'Noch keine Ausgaben', amount: 0 };
}

function budgetStatus() {
  const exceeded = state.budgets.filter((budget) => spentFor(budget.category) > budget.limit).length;
  if (exceeded > 0) return `${exceeded} Budget${exceeded > 1 ? 's' : ''} ueberschritten`;
  return 'Alle Budgets im Rahmen';
}

function pageTitle() {
  const titles = {
    '/': 'Dashboard',
    '/transactions': 'Transaktionen',
    '/budgets': 'Budgets',
    '/analysis': 'Analyse',
    '/about': 'Info'
  };
  return titles[route] || 'Dashboard';
}

function navigate(path) {
  route = normaliseRoute(path);
  notice = '';
  errors = {};
  editingId = null;
  window.history.pushState({}, '', route);
  render();
}

window.addEventListener('popstate', () => {
  route = normaliseRoute(window.location.pathname);
  render();
});

function statCard(label, value, helper) {
  return `
    <article class="stat-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${helper}</small>
    </article>
  `;
}

function navigation() {
  const links = [
    ['/', 'Dashboard'],
    ['/transactions', 'Transaktionen'],
    ['/budgets', 'Budgets'],
    ['/analysis', 'Analyse'],
    ['/about', 'Info']
  ];

  return `
    <header class="topbar">
      <a class="brand" href="/" data-link>Budgetplaner</a>
      <nav class="nav" aria-label="Hauptnavigation">
        ${links.map(([path, label]) => `<a href="${path}" data-link class="${route === path ? 'active' : ''}">${label}</a>`).join('')}
      </nav>
    </header>
  `;
}

function dashboardPage() {
  const summary = totals();
  const recent = [...state.transactions].sort(byDateDesc).slice(0, 5);

  return `
    <section class="page-header">
      <p class="eyebrow">Testbarer Prototyp</p>
      <h1>Finanzen schnell verstehen</h1>
      <p>Diese Uebersicht zeigt Testpersonen die wichtigsten Zahlen und fuehrt direkt zu den Kernaufgaben.</p>
    </section>

    <section class="stats-grid">
      ${statCard('Einnahmen', formatCHF(summary.income), 'Aktuelle Demo- und lokale Daten')}
      ${statCard('Ausgaben', formatCHF(summary.expenses), 'Alle erfassten Ausgaben')}
      ${statCard('Aktueller Saldo', formatCHF(summary.balance), 'Verfuegbarer Betrag')}
      ${statCard('Budgetstatus', budgetStatus(), 'Automatisch aus Budgets berechnet')}
    </section>

    <section class="actions-row" aria-label="Schnelle Aktionen">
      <a class="button primary" href="/transactions" data-link>Neue Ausgabe erfassen</a>
      <a class="button" href="/budgets" data-link>Budget verwalten</a>
      <a class="button" href="/analysis" data-link>Analyse ansehen</a>
    </section>

    <section class="panel">
      <div class="section-title">
        <h2>Letzte Transaktionen</h2>
        <a href="/transactions" data-link>Alle anzeigen</a>
      </div>
      ${transactionList(recent, false)}
    </section>
  `;
}

function transactionForm() {
  const current = editingId ? state.transactions.find((item) => item.id === editingId) : null;
  return `
    <form class="form" id="transaction-form" novalidate>
      <input type="hidden" name="id" value="${current?.id || ''}" />
      <div class="form-grid">
        <label>
          Titel
          <input name="title" type="text" value="${escapeHtml(current?.title || '')}" placeholder="z.B. Mensa Mittagessen" />
          ${errors.title ? `<span class="error">${errors.title}</span>` : ''}
        </label>
        <label>
          Betrag in CHF
          <input name="amount" type="number" min="0.01" step="0.05" value="${current?.amount || ''}" placeholder="24.50" />
          ${errors.amount ? `<span class="error">${errors.amount}</span>` : ''}
        </label>
        <label>
          Typ
          <select name="type">
            <option value="expense" ${current?.type !== 'income' ? 'selected' : ''}>Ausgabe</option>
            <option value="income" ${current?.type === 'income' ? 'selected' : ''}>Einnahme</option>
          </select>
        </label>
        <label>
          Kategorie
          <input name="category" type="text" value="${escapeHtml(current?.category || '')}" placeholder="z.B. Essen" />
          ${errors.category ? `<span class="error">${errors.category}</span>` : ''}
        </label>
        <label>
          Datum
          <input name="date" type="date" value="${escapeHtml(current?.date || new Date().toISOString().slice(0, 10))}" />
        </label>
        <label>
          Notiz optional
          <input name="note" type="text" value="${escapeHtml(current?.note || '')}" placeholder="Optionaler Kontext" />
        </label>
      </div>
      <div class="form-actions">
        <button class="button primary" type="submit">${current ? 'Transaktion aktualisieren' : 'Transaktion speichern'}</button>
        ${current ? '<button class="button subtle" type="button" data-cancel-edit>Abbrechen</button>' : ''}
      </div>
    </form>
  `;
}

function transactionList(items = state.transactions, editable = true) {
  if (items.length === 0) {
    return '<p class="empty">Noch keine Transaktionen vorhanden.</p>';
  }

  return `
    <div class="list">
      ${items.map((item) => `
        <article class="list-item">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.category)} · ${new Date(item.date).toLocaleDateString('de-CH')}</span>
            ${item.note ? `<small>${escapeHtml(item.note)}</small>` : ''}
          </div>
          <div class="item-actions">
            <strong class="${item.type === 'income' ? 'positive' : 'negative'}">${item.type === 'income' ? '+' : '-'} ${formatCHF(item.amount)}</strong>
            ${editable ? `
              <button class="icon-button" type="button" data-edit-transaction="${item.id}">Bearbeiten</button>
              <button class="icon-button danger" type="button" data-delete-transaction="${item.id}">Loeschen</button>
            ` : ''}
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

function transactionsPage() {
  return `
    <section class="page-header">
      <h1>Transaktionen erfassen</h1>
      <p>Testpersonen koennen Einnahmen und Ausgaben anlegen, pruefen, bearbeiten und loeschen.</p>
    </section>
    ${notice ? `<div class="notice">${notice}</div>` : ''}
    <section class="two-column">
      <article class="panel">
        <h2>${editingId ? 'Transaktion bearbeiten' : 'Neue Transaktion'}</h2>
        ${transactionForm()}
      </article>
      <article class="panel">
        <h2>Alle Transaktionen</h2>
        ${transactionList([...state.transactions].sort(byDateDesc))}
      </article>
    </section>
  `;
}

function budgetCard(budget) {
  const spent = spentFor(budget.category);
  const percentage = Math.min((spent / budget.limit) * 100, 100);
  const isExceeded = spent > budget.limit;

  return `
    <article class="budget-card ${isExceeded ? 'warning' : ''}">
      <div class="section-title">
        <h3>${escapeHtml(budget.category)}</h3>
        <strong>${formatCHF(budget.limit)}</strong>
      </div>
      <p>${formatCHF(spent)} von ${formatCHF(budget.limit)} verwendet</p>
      <div class="progress" aria-label="Budgetfortschritt">
        <span style="width: ${percentage}%"></span>
      </div>
      ${isExceeded ? '<p class="warning-text">Budget ueberschritten</p>' : '<p class="muted">Budget im Rahmen</p>'}
    </article>
  `;
}

function budgetsPage() {
  return `
    <section class="page-header">
      <h1>Budgets verwalten</h1>
      <p>Budgets werden lokal gespeichert und mit den Ausgaben der passenden Kategorie verglichen.</p>
    </section>
    ${notice ? `<div class="notice">${notice}</div>` : ''}
    <section class="two-column">
      <article class="panel">
        <h2>Neues Budget</h2>
        <form class="form" id="budget-form" novalidate>
          <label>
            Kategorie
            <input name="category" type="text" placeholder="z.B. Lernen" />
            ${errors.category ? `<span class="error">${errors.category}</span>` : ''}
          </label>
          <label>
            Monatsbudget in CHF
            <input name="limit" type="number" min="0.01" step="1" placeholder="120" />
            ${errors.limit ? `<span class="error">${errors.limit}</span>` : ''}
          </label>
          <button class="button primary" type="submit">Budget speichern</button>
        </form>
      </article>
      <article class="panel">
        <h2>Budgetstatus</h2>
        <div class="budget-grid">
          ${state.budgets.map(budgetCard).join('')}
        </div>
      </article>
    </section>
  `;
}

function analysisPage() {
  const summary = totals();
  const biggest = biggestExpenseCategory();
  const categories = state.budgets.map((budget) => ({ ...budget, spent: spentFor(budget.category) }));
  const maxValue = Math.max(...categories.map((item) => item.spent), 1);

  return `
    <section class="page-header">
      <h1>Analyse</h1>
      <p>Einfache Kennzahlen helfen Testpersonen, die finanzielle Situation schnell zu interpretieren.</p>
    </section>
    <section class="stats-grid">
      ${statCard('Groesste Ausgabenkategorie', escapeHtml(biggest.category), formatCHF(biggest.amount))}
      ${statCard('Total Einnahmen', formatCHF(summary.income), 'Summe aller Einnahmen')}
      ${statCard('Total Ausgaben', formatCHF(summary.expenses), 'Summe aller Ausgaben')}
      ${statCard('Sparbetrag', formatCHF(summary.balance), 'Einnahmen minus Ausgaben')}
    </section>
    <section class="panel">
      <h2>Ausgaben nach Budgetkategorie</h2>
      <div class="bars">
        ${categories.map((item) => `
          <div class="bar-row">
            <span>${escapeHtml(item.category)}</span>
            <div class="bar"><span style="width: ${(item.spent / maxValue) * 100}%"></span></div>
            <strong>${formatCHF(item.spent)}</strong>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function aboutPage() {
  return `
    <section class="page-header">
      <h1>Info fuer Testpersonen</h1>
      <p>Der Budgetplaner ist ein ZHAW-Prototyp fuer eine Usability-Evaluation.</p>
    </section>
    <section class="panel readable">
      <h2>Was macht die App?</h2>
      <p>Die App hilft dabei, Einnahmen, Ausgaben und einfache Monatsbudgets zu erfassen und zu verstehen.</p>
      <h2>Fuer wen ist sie gedacht?</h2>
      <p>Der Prototyp richtet sich an Studierende und junge Erwachsene mit begrenztem monatlichem Budget.</p>
      <h2>Welche Workflows werden getestet?</h2>
      <ul>
        <li>Dashboard verstehen und verfuegbares Geld erkennen</li>
        <li>Neue Ausgabe erfassen</li>
        <li>Budget anschauen oder erstellen</li>
        <li>Budgetueberschreitung erkennen</li>
        <li>Analyse-Seite interpretieren</li>
      </ul>
    </section>
  `;
}

function content() {
  if (route === '/transactions') return transactionsPage();
  if (route === '/budgets') return budgetsPage();
  if (route === '/analysis') return analysisPage();
  if (route === '/about') return aboutPage();
  return dashboardPage();
}

function render() {
  document.querySelector('#app').innerHTML = `
    ${navigation()}
    <main class="shell">
      ${content()}
    </main>
  `;
  document.title = `${pageTitle()} - Budgetplaner`;
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      navigate(link.getAttribute('href'));
    });
  });

  const transactionFormElement = document.querySelector('#transaction-form');
  if (transactionFormElement) {
    transactionFormElement.addEventListener('submit', handleTransactionSubmit);
  }

  const budgetFormElement = document.querySelector('#budget-form');
  if (budgetFormElement) {
    budgetFormElement.addEventListener('submit', handleBudgetSubmit);
  }

  document.querySelectorAll('[data-delete-transaction]').forEach((button) => {
    button.addEventListener('click', () => {
      state.transactions = state.transactions.filter((item) => item.id !== button.dataset.deleteTransaction);
      saveState();
      notice = 'Transaktion wurde geloescht.';
      render();
    });
  });

  document.querySelectorAll('[data-edit-transaction]').forEach((button) => {
    button.addEventListener('click', () => {
      editingId = button.dataset.editTransaction;
      notice = '';
      errors = {};
      render();
    });
  });

  const cancelButton = document.querySelector('[data-cancel-edit]');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      editingId = null;
      render();
    });
  }
}

function handleTransactionSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const amount = Number(data.amount);
  errors = {};

  if (!data.title.trim()) errors.title = 'Titel darf nicht leer sein.';
  if (!amount || amount <= 0) errors.amount = 'Betrag muss groesser als 0 sein.';
  if (!data.category.trim()) errors.category = 'Kategorie darf nicht leer sein.';

  if (Object.keys(errors).length > 0) {
    render();
    return;
  }

  const transaction = {
    id: data.id || crypto.randomUUID(),
    title: data.title.trim(),
    amount,
    type: data.type,
    category: data.category.trim(),
    date: data.date || new Date().toISOString().slice(0, 10),
    note: data.note.trim()
  };

  if (data.id) {
    state.transactions = state.transactions.map((item) => (item.id === data.id ? transaction : item));
    notice = 'Transaktion wurde aktualisiert.';
  } else {
    state.transactions = [transaction, ...state.transactions];
    notice = 'Transaktion wurde gespeichert.';
  }

  editingId = null;
  saveState();
  render();
}

function handleBudgetSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const limit = Number(data.limit);
  errors = {};

  if (!data.category.trim()) errors.category = 'Kategorie darf nicht leer sein.';
  if (!limit || limit <= 0) errors.limit = 'Budget muss groesser als 0 sein.';

  if (Object.keys(errors).length > 0) {
    render();
    return;
  }

  const category = data.category.trim();
  const existing = state.budgets.find((budget) => budget.category.toLowerCase() === category.toLowerCase());

  if (existing) {
    existing.limit = limit;
    notice = 'Budget wurde aktualisiert.';
  } else {
    state.budgets = [{ id: crypto.randomUUID(), category, limit }, ...state.budgets];
    notice = 'Budget wurde gespeichert.';
  }

  saveState();
  errors = {};
  render();
}

render();
