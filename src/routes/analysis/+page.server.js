import { redirect } from '@sveltejs/kit';
import { getTransactions, getBudgets } from '$lib/db.js';

export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');

  const [transactions, budgets] = await Promise.all([
    getTransactions(locals.user.id),
    getBudgets(locals.user.id)
  ]);

  return { transactions, budgets };
}
