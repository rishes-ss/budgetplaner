import dns from 'node:dns';
import { MongoClient, ObjectId } from 'mongodb';
import { env } from '$env/dynamic/private';

// Node.js picks up broken IPv6-only DNS servers on some Windows setups; force reliable resolvers.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const MONGODB_URI = env.DB_URI;

let clientPromise = null;

function getClient() {
  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI);
    clientPromise = client.connect().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

async function getDb() {
  const client = await getClient();
  return client.db('budgetplaner');
}

// ─── Users ───────────────────────────────────────────────────────

export async function createUser(email, username, passwordHash, role = 'user') {
  const db = await getDb();
  const result = await db.collection('users').insertOne({
    email: email.toLowerCase().trim(),
    username: username.trim(),
    passwordHash,
    role,
    createdAt: new Date()
  });
  return result.insertedId;
}

export async function ensureAdminExists(passwordHash) {
  const db = await getDb();
  const existing = await db.collection('users').findOne({ email: 'admin@test.ch' });
  if (!existing) {
    await db.collection('users').insertOne({
      email: 'admin@test.ch',
      username: 'Admin',
      passwordHash,
      role: 'admin',
      createdAt: new Date()
    });
  } else if (existing.role !== 'admin') {
    await db.collection('users').updateOne({ _id: existing._id }, { $set: { role: 'admin' } });
  }
}

export async function getAllUsers() {
  const db = await getDb();
  const users = await db
    .collection('users')
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: 1 })
    .toArray();
  return users.map((u) => ({
    id: u._id.toString(),
    email: u.email,
    username: u.username,
    role: u.role ?? 'user',
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt
  }));
}

export async function deleteUser(id) {
  const db = await getDb();
  const userId = id.toString();
  await db.collection('transactions').deleteMany({ userId });
  await db.collection('budgets').deleteMany({ userId });
  await db.collection('sessions').deleteMany({ userId });
  await db.collection('savings_goals').deleteMany({ userId });
  await db.collection('users').deleteOne({ _id: new ObjectId(id) });
}

export async function getUserByEmail(email) {
  const db = await getDb();
  return db.collection('users').findOne({ email: email.toLowerCase().trim() });
}

export async function getUserById(id) {
  const db = await getDb();
  try {
    return db.collection('users').findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

// ─── Sessions ────────────────────────────────────────────────────

export async function createSession(userId) {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.collection('sessions').insertOne({
    _id: id,
    userId: userId.toString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  return id;
}

export async function getSession(id) {
  const db = await getDb();
  const session = await db.collection('sessions').findOne({ _id: id });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function deleteSession(id) {
  const db = await getDb();
  await db.collection('sessions').deleteOne({ _id: id });
}

// ─── Transactions ─────────────────────────────────────────────────

export async function getTransactions(userId) {
  const db = await getDb();
  const items = await db
    .collection('transactions')
    .find({ userId })
    .sort({ date: -1, createdAt: -1 })
    .toArray();
  return items.map(toPlain);
}

export async function createTransaction(userId, data) {
  const db = await getDb();
  const result = await db.collection('transactions').insertOne({
    userId,
    title: data.title.trim(),
    amount: Number(data.amount),
    type: data.type,
    category: data.category.trim(),
    date: data.date,
    note: (data.note || '').trim(),
    isRecurring: Boolean(data.isRecurring),
    recurrenceInterval: data.isRecurring ? (data.recurrenceInterval || 'monthly') : null,
    createdAt: new Date()
  });
  return result.insertedId.toString();
}

export async function updateTransaction(id, userId, data) {
  const db = await getDb();
  return db.collection('transactions').updateOne(
    { _id: new ObjectId(id), userId },
    {
      $set: {
        title: data.title.trim(),
        amount: Number(data.amount),
        type: data.type,
        category: data.category.trim(),
        date: data.date,
        note: (data.note || '').trim(),
        isRecurring: Boolean(data.isRecurring),
        recurrenceInterval: data.isRecurring ? (data.recurrenceInterval || 'monthly') : null
      }
    }
  );
}

export async function deleteTransaction(id, userId) {
  const db = await getDb();
  return db.collection('transactions').deleteOne({ _id: new ObjectId(id), userId });
}

// ─── Recurring expansion ──────────────────────────────────────────

export function expandTransactionsForMonth(transactions, month) {
  const [year, mon] = month.split('-').map(Number);
  const result = [];

  for (const tx of transactions) {
    const txMonth = tx.date.slice(0, 7);

    if (!tx.isRecurring) {
      if (txMonth === month) result.push(tx);
      continue;
    }

    if (txMonth > month) continue;

    const txDate = new Date(tx.date + 'T12:00:00');
    const interval = tx.recurrenceInterval || 'monthly';

    if (interval === 'monthly') {
      const lastDay = new Date(year, mon, 0).getDate();
      const day = Math.min(txDate.getDate(), lastDay);
      result.push({
        ...tx,
        date: `${month}-${String(day).padStart(2, '0')}`,
        _generated: txMonth !== month
      });
    } else if (interval === 'yearly') {
      if (txDate.getMonth() + 1 === mon) {
        result.push({
          ...tx,
          date: `${year}-${String(mon).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`,
          _generated: txDate.getFullYear() !== year
        });
      }
    } else if (interval === 'weekly') {
      const startOfMonth = new Date(year, mon - 1, 1);
      const endOfMonth = new Date(year, mon, 0);
      let cur = new Date(txDate);
      while (cur < startOfMonth) cur = new Date(cur.getTime() + 7 * 86400000);
      let idx = 0;
      while (cur <= endOfMonth) {
        const d = cur;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        result.push({ ...tx, _id: `${tx._id}_w${idx}`, date: dateStr, _generated: true });
        cur = new Date(cur.getTime() + 7 * 86400000);
        idx++;
      }
    }
  }

  return result.sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Budgets ──────────────────────────────────────────────────────

export async function getBudgets(userId) {
  const db = await getDb();
  const items = await db.collection('budgets').find({ userId }).sort({ category: 1 }).toArray();
  return items.map(toPlain);
}

export async function upsertBudget(userId, category, limit, rolloverEnabled = false, rolloverPercent = 50) {
  const db = await getDb();
  const cat = category.trim();
  const existing = await db.collection('budgets').findOne({
    userId,
    category: { $regex: new RegExp(`^${escapeRegex(cat)}$`, 'i') }
  });

  if (existing) {
    await db.collection('budgets').updateOne(
      { _id: existing._id },
      { $set: { limit: Number(limit), rolloverEnabled: Boolean(rolloverEnabled), rolloverPercent: Number(rolloverPercent) } }
    );
    return existing._id.toString();
  }

  const result = await db.collection('budgets').insertOne({
    userId,
    category: cat,
    limit: Number(limit),
    rolloverEnabled: Boolean(rolloverEnabled),
    rolloverPercent: Number(rolloverPercent),
    rolloverAmount: 0,
    rolloverAppliedMonth: null,
    createdAt: new Date()
  });
  return result.insertedId.toString();
}

export async function deleteBudget(id, userId) {
  const db = await getDb();
  return db.collection('budgets').deleteOne({ _id: new ObjectId(id), userId });
}

// Applies rollover from previousMonth to budgets for currentMonth (runs once per month).
export async function applyRolloversIfNeeded(userId, currentMonth, previousMonth) {
  const db = await getDb();
  const budgets = await db
    .collection('budgets')
    .find({ userId, rolloverEnabled: true })
    .toArray();

  for (const budget of budgets) {
    if (budget.rolloverAppliedMonth === currentMonth) continue;

    const [py, pm] = previousMonth.split('-').map(Number);
    const lastDay = new Date(py, pm, 0).getDate();
    const startOfPrev = `${previousMonth}-01`;
    const endOfPrev = `${previousMonth}-${String(lastDay).padStart(2, '0')}`;

    const agg = await db.collection('transactions').aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          category: { $regex: new RegExp(`^${escapeRegex(budget.category)}$`, 'i') },
          date: { $gte: startOfPrev, $lte: endOfPrev }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();

    const spent = agg[0]?.total ?? 0;
    const unused = Math.max(budget.limit - spent, 0);
    const rolloverAmount = Math.round(unused * ((budget.rolloverPercent ?? 50) / 100) * 100) / 100;

    await db.collection('budgets').updateOne(
      { _id: budget._id },
      { $set: { rolloverAmount, rolloverAppliedMonth: currentMonth } }
    );
  }
}

// ─── Savings Goals ────────────────────────────────────────────────

export async function getSavingsGoals(userId) {
  const db = await getDb();
  const items = await db
    .collection('savings_goals')
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return items.map(toPlain);
}

export async function createSavingsGoal(userId, data) {
  const db = await getDb();
  const result = await db.collection('savings_goals').insertOne({
    userId,
    name: data.name.trim(),
    targetAmount: Number(data.targetAmount),
    savedAmount: 0,
    deadline: data.deadline || null,
    createdAt: new Date()
  });
  return result.insertedId.toString();
}

export async function addSavingsContribution(id, userId, amount) {
  const db = await getDb();
  return db.collection('savings_goals').updateOne(
    { _id: new ObjectId(id), userId },
    { $inc: { savedAmount: Number(amount) } }
  );
}

export async function updateSavingsGoal(id, userId, data) {
  const db = await getDb();
  return db.collection('savings_goals').updateOne(
    { _id: new ObjectId(id), userId },
    {
      $set: {
        name: data.name.trim(),
        targetAmount: Number(data.targetAmount),
        deadline: data.deadline || null
      }
    }
  );
}

export async function deleteSavingsGoal(id, userId) {
  const db = await getDb();
  return db.collection('savings_goals').deleteOne({ _id: new ObjectId(id), userId });
}

// ─── Helpers ──────────────────────────────────────────────────────

function toPlain(doc) {
  const result = { ...doc, _id: doc._id.toString() };
  if (result.createdAt instanceof Date) result.createdAt = result.createdAt.toISOString();
  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
