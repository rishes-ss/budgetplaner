import { fail, redirect } from '@sveltejs/kit';
import { getBudgets, upsertBudget, deleteBudget, getTransactions, applyRolloversIfNeeded, expandTransactionsForMonth } from '$lib/db.js';

function monthStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function prevMonthStr(d) {
  const p = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return monthStr(p);
}

export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');

  const now = new Date();
  const current = monthStr(now);
  const previous = prevMonthStr(now);

  await applyRolloversIfNeeded(locals.user.id, current, previous);

  const [budgets, allTransactions] = await Promise.all([
    getBudgets(locals.user.id),
    getTransactions(locals.user.id)
  ]);

  const transactions = expandTransactionsForMonth(allTransactions, current);

  return { budgets, transactions };
}

export const actions = {
  save: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');

    const data = await request.formData();
    const category = String(data.get('category') ?? '').trim();
    const limit = parseFloat(String(data.get('limit') ?? ''));
    const rolloverEnabled = data.get('rolloverEnabled') === 'true';
    const rolloverPercent = parseFloat(String(data.get('rolloverPercent') ?? '50')) || 50;

    const errors = {};
    if (!category) errors.category = 'Kategorie ist erforderlich.';
    if (!limit || limit <= 0) errors.limit = 'Budget muss grösser als 0 sein.';
    if (rolloverPercent < 0 || rolloverPercent > 100) errors.rolloverPercent = 'Muss zwischen 0 und 100 sein.';

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, values: { category, limit, rolloverEnabled, rolloverPercent } });
    }

    await upsertBudget(locals.user.id, category, limit, rolloverEnabled, rolloverPercent);
    return { success: 'Budget wurde gespeichert.' };
  },

  delete: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');
    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    await deleteBudget(id, locals.user.id);
    return { success: 'Budget wurde gelöscht.' };
  }
};
