import { MongoClient, ObjectId } from 'mongodb';
import { MONGODB_URI } from '$env/static/private';

let clientPromise = null;

function getClient() {
  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI);
    clientPromise = client.connect();
  }
  return clientPromise;
}

async function getDb() {
  const client = await getClient();
  return client.db('budgetplaner');
}

// ─── Users ───────────────────────────────────────────────────────

export async function createUser(email, username, passwordHash) {
  const db = await getDb();
  const result = await db.collection('users').insertOne({
    email: email.toLowerCase().trim(),
    username: username.trim(),
    passwordHash,
    createdAt: new Date()
  });
  return result.insertedId;
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
        note: (data.note || '').trim()
      }
    }
  );
}

export async function deleteTransaction(id, userId) {
  const db = await getDb();
  return db.collection('transactions').deleteOne({ _id: new ObjectId(id), userId });
}

// ─── Budgets ──────────────────────────────────────────────────────

export async function getBudgets(userId) {
  const db = await getDb();
  const items = await db.collection('budgets').find({ userId }).sort({ category: 1 }).toArray();
  return items.map(toPlain);
}

export async function upsertBudget(userId, category, limit) {
  const db = await getDb();
  const cat = category.trim();
  const existing = await db.collection('budgets').findOne({
    userId,
    category: { $regex: new RegExp(`^${escapeRegex(cat)}$`, 'i') }
  });

  if (existing) {
    await db.collection('budgets').updateOne({ _id: existing._id }, { $set: { limit: Number(limit) } });
    return existing._id.toString();
  }

  const result = await db.collection('budgets').insertOne({
    userId,
    category: cat,
    limit: Number(limit),
    createdAt: new Date()
  });
  return result.insertedId.toString();
}

export async function deleteBudget(id, userId) {
  const db = await getDb();
  return db.collection('budgets').deleteOne({ _id: new ObjectId(id), userId });
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
