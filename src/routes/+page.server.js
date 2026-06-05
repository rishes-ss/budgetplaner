import { redirect } from '@sveltejs/kit';
import { getTransactions, getBudgets, expandTransactionsForMonth } from '$lib/db.js';

function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function load({ locals, url }) {
  if (!locals.user) throw redirect(303, '/login');

  const today = currentMonthStr();
  const month = url.searchParams.get('month') || today;

  const [allTransactions, budgets] = await Promise.all([
    getTransactions(locals.user.id),
    getBudgets(locals.user.id)
  ]);

  const transactions = expandTransactionsForMonth(allTransactions, month);

  return { transactions, budgets, month, currentMonth: today };
}
