import { fail, redirect } from '@sveltejs/kit';
import { getBudgets, upsertBudget, deleteBudget, getTransactions } from '$lib/db.js';

export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');

  const [budgets, transactions] = await Promise.all([
    getBudgets(locals.user.id),
    getTransactions(locals.user.id)
  ]);

  return { budgets, transactions };
}

export const actions = {
  save: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');

    const data = await request.formData();
    const category = String(data.get('category') ?? '').trim();
    const limit = parseFloat(String(data.get('limit') ?? ''));

    const errors = {};
    if (!category) errors.category = 'Kategorie ist erforderlich.';
    if (!limit || limit <= 0) errors.limit = 'Budget muss grösser als 0 sein.';

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, values: { category, limit } });
    }

    await upsertBudget(locals.user.id, category, limit);
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
