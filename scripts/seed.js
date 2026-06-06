import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://Admin:1234@cluster0.h99hzr7.mongodb.net/budgetplaner?appName=Cluster0';
const USER_EMAIL = 'rishe@test.ch';
const USER_PASSWORD = 'Test1234';
const USER_NAME = 'Rishe';

const client = new MongoClient(MONGODB_URI);

async function seed() {
  await client.connect();
  const db = client.db('budgetplaner');

  // ── User anlegen oder finden ──────────────────────────────────────
  let user = await db.collection('users').findOne({ email: USER_EMAIL });
  if (!user) {
    const passwordHash = await bcrypt.hash(USER_PASSWORD, 10);
    const res = await db.collection('users').insertOne({
      email: USER_EMAIL,
      username: USER_NAME,
      passwordHash,
      role: 'user',
      createdAt: new Date()
    });
    user = { _id: res.insertedId };
    console.log(`✓ Benutzer "${USER_EMAIL}" erstellt (Passwort: ${USER_PASSWORD})`);
  } else {
    console.log(`✓ Benutzer "${USER_EMAIL}" bereits vorhanden — Daten werden hinzugefügt`);
  }

  const userId = user._id.toString();

  // ── Bestehende Testdaten löschen ──────────────────────────────────
  await db.collection('transactions').deleteMany({ userId });
  await db.collection('budgets').deleteMany({ userId });
  await db.collection('savings_goals').deleteMany({ userId });

  // ── Transaktionen ─────────────────────────────────────────────────
  const transactions = [
    // ─ April 2026 ─
    { title: 'Gehalt April', amount: 4800, type: 'income', category: 'Gehalt', date: '2026-04-01', note: '', isRecurring: true, recurrenceInterval: 'monthly' },
    { title: 'Miete April', amount: 1450, type: 'expense', category: 'Miete', date: '2026-04-01', note: '', isRecurring: true, recurrenceInterval: 'monthly' },
    { title: 'Migros Wocheneinkauf', amount: 87.40, type: 'expense', category: 'Lebensmittel', date: '2026-04-03', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'SBB Monatsabo', amount: 155, type: 'expense', category: 'Transport', date: '2026-04-05', note: '', isRecurring: true, recurrenceInterval: 'monthly' },
    { title: 'Netflix', amount: 17.90, type: 'expense', category: 'Unterhaltung', date: '2026-04-06', note: '', isRecurring: true, recurrenceInterval: 'monthly' },
    { title: 'Restaurant Chez Léon', amount: 42.50, type: 'expense', category: 'Restaurant', date: '2026-04-08', note: 'Mittagessen mit Kolleg', isRecurring: false, recurrenceInterval: null },
    { title: 'Coop Einkauf', amount: 64.20, type: 'expense', category: 'Lebensmittel', date: '2026-04-10', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Krankenkasse', amount: 380, type: 'expense', category: 'Gesundheit', date: '2026-04-15', note: '', isRecurring: true, recurrenceInterval: 'monthly' },
    { title: 'Freelance Projekt', amount: 650, type: 'income', category: 'Nebeneinkommen', date: '2026-04-16', note: 'Webdesign Auftrag', isRecurring: false, recurrenceInterval: null },
    { title: 'Zalando Bestellung', amount: 89.90, type: 'expense', category: 'Kleidung', date: '2026-04-18', note: 'Neue Sportschuhe', isRecurring: false, recurrenceInterval: null },
    { title: 'Migros Einkauf', amount: 71.30, type: 'expense', category: 'Lebensmittel', date: '2026-04-22', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Kino + Snacks', amount: 28.00, type: 'expense', category: 'Freizeit', date: '2026-04-25', note: 'Avengers: Doomsday', isRecurring: false, recurrenceInterval: null },
    { title: 'Zahnarzt', amount: 120, type: 'expense', category: 'Gesundheit', date: '2026-04-28', note: 'Routineuntersuchung', isRecurring: false, recurrenceInterval: null },
    { title: 'Tankstelle', amount: 75.60, type: 'expense', category: 'Transport', date: '2026-04-29', note: '', isRecurring: false, recurrenceInterval: null },

    // ─ Mai 2026 ─
    { title: 'Gehalt Mai', amount: 4800, type: 'income', category: 'Gehalt', date: '2026-05-01', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Miete Mai', amount: 1450, type: 'expense', category: 'Miete', date: '2026-05-01', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'SBB Monatsabo', amount: 155, type: 'expense', category: 'Transport', date: '2026-05-05', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Netflix', amount: 17.90, type: 'expense', category: 'Unterhaltung', date: '2026-05-06', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Coop Wocheneinkauf', amount: 93.70, type: 'expense', category: 'Lebensmittel', date: '2026-05-07', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Krankenkasse', amount: 380, type: 'expense', category: 'Gesundheit', date: '2026-05-15', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Migros Einkauf', amount: 55.80, type: 'expense', category: 'Lebensmittel', date: '2026-05-12', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Geburtstag Geschenk', amount: 60.00, type: 'expense', category: 'Sonstiges', date: '2026-05-14', note: 'Geschenk für Mia', isRecurring: false, recurrenceInterval: null },
    { title: 'Restaurant Tibits', amount: 35.50, type: 'expense', category: 'Restaurant', date: '2026-05-20', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Spotify', amount: 11.95, type: 'expense', category: 'Unterhaltung', date: '2026-05-22', note: '', isRecurring: true, recurrenceInterval: 'monthly' },
    { title: 'Tankstelle', amount: 82.40, type: 'expense', category: 'Transport', date: '2026-05-24', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Apotheke', amount: 23.50, type: 'expense', category: 'Gesundheit', date: '2026-05-27', note: 'Vitamintabletten', isRecurring: false, recurrenceInterval: null },
    { title: 'Bonus Q2', amount: 500, type: 'income', category: 'Gehalt', date: '2026-05-30', note: 'Quartalsbonus', isRecurring: false, recurrenceInterval: null },

    // ─ Juni 2026 (laufender Monat) ─
    { title: 'Gehalt Juni', amount: 4800, type: 'income', category: 'Gehalt', date: '2026-06-01', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Miete Juni', amount: 1450, type: 'expense', category: 'Miete', date: '2026-06-01', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'SBB Monatsabo', amount: 155, type: 'expense', category: 'Transport', date: '2026-06-05', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Netflix', amount: 17.90, type: 'expense', category: 'Unterhaltung', date: '2026-06-06', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Spotify', amount: 11.95, type: 'expense', category: 'Unterhaltung', date: '2026-06-06', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Coop Einkauf', amount: 78.60, type: 'expense', category: 'Lebensmittel', date: '2026-06-03', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Krankenkasse', amount: 380, type: 'expense', category: 'Gesundheit', date: '2026-06-15', note: '', isRecurring: false, recurrenceInterval: null },
    { title: 'Freelance Projekt', amount: 900, type: 'income', category: 'Nebeneinkommen', date: '2026-06-05', note: 'App-Entwicklung Auftrag', isRecurring: false, recurrenceInterval: null },
  ];

  const txDocs = transactions.map(tx => ({
    ...tx,
    userId,
    createdAt: new Date()
  }));
  await db.collection('transactions').insertMany(txDocs);
  console.log(`✓ ${txDocs.length} Transaktionen eingefügt`);

  // ── Budgets ───────────────────────────────────────────────────────
  const budgets = [
    { category: 'Lebensmittel', limit: 350, rolloverEnabled: true, rolloverPercent: 50 },
    { category: 'Restaurant', limit: 150, rolloverEnabled: false, rolloverPercent: 50 },
    { category: 'Transport', limit: 300, rolloverEnabled: false, rolloverPercent: 50 },
    { category: 'Unterhaltung', limit: 80, rolloverEnabled: true, rolloverPercent: 100 },
    { category: 'Gesundheit', limit: 500, rolloverEnabled: false, rolloverPercent: 50 },
    { category: 'Kleidung', limit: 200, rolloverEnabled: true, rolloverPercent: 50 },
    { category: 'Freizeit', limit: 100, rolloverEnabled: false, rolloverPercent: 50 },
    { category: 'Sonstiges', limit: 150, rolloverEnabled: false, rolloverPercent: 50 },
  ];

  const budgetDocs = budgets.map(b => ({
    ...b,
    userId,
    rolloverAmount: 0,
    rolloverAppliedMonth: null,
    createdAt: new Date()
  }));
  await db.collection('budgets').insertMany(budgetDocs);
  console.log(`✓ ${budgetDocs.length} Budgets eingefügt`);

  // ── Sparziele ─────────────────────────────────────────────────────
  const savingsGoals = [
    { name: 'Urlaub Japan 🗾', targetAmount: 3500, savedAmount: 1200, deadline: '2026-12-01' },
    { name: 'Neues MacBook', targetAmount: 2499, savedAmount: 800, deadline: '2026-09-01' },
    { name: 'Notfallreserve', targetAmount: 10000, savedAmount: 4500, deadline: null },
    { name: 'E-Bike', targetAmount: 2000, savedAmount: 350, deadline: '2027-03-01' },
  ];

  const goalDocs = savingsGoals.map(g => ({
    ...g,
    userId,
    createdAt: new Date()
  }));
  await db.collection('savings_goals').insertMany(goalDocs);
  console.log(`✓ ${goalDocs.length} Sparziele eingefügt`);

  console.log('\n══════════════════════════════════════════');
  console.log('  Login-Daten:');
  console.log(`  E-Mail:    ${USER_EMAIL}`);
  console.log(`  Passwort:  ${USER_PASSWORD}`);
  console.log('══════════════════════════════════════════\n');

  await client.close();
}

seed().catch(err => {
  console.error('Fehler:', err);
  process.exit(1);
});
