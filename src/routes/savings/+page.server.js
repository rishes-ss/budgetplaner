import { fail, redirect } from '@sveltejs/kit';
import {
  getSavingsGoals,
  createSavingsGoal,
  addSavingsContribution,
  updateSavingsGoal,
  deleteSavingsGoal
} from '$lib/db.js';

export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  const goals = await getSavingsGoals(locals.user.id);
  return { goals };
}

export const actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');

    const data = await request.formData();
    const name = String(data.get('name') ?? '').trim();
    const targetAmount = parseFloat(String(data.get('targetAmount') ?? ''));
    const deadline = String(data.get('deadline') ?? '').trim();

    const errors = {};
    if (!name) errors.name = 'Name ist erforderlich.';
    if (!targetAmount || targetAmount <= 0) errors.targetAmount = 'Zielbetrag muss grösser als 0 sein.';

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, values: { name, targetAmount, deadline }, action: 'create' });
    }

    await createSavingsGoal(locals.user.id, { name, targetAmount, deadline: deadline || null });
    return { success: 'Sparziel wurde angelegt.' };
  },

  contribute: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');

    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    const amount = parseFloat(String(data.get('amount') ?? ''));

    if (!amount || amount <= 0) {
      return fail(400, { errors: { contribution: 'Betrag muss grösser als 0 sein.' }, action: 'contribute', id });
    }

    await addSavingsContribution(id, locals.user.id, amount);
    return { success: 'Einzahlung gespeichert.' };
  },

  update: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');

    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    const name = String(data.get('name') ?? '').trim();
    const targetAmount = parseFloat(String(data.get('targetAmount') ?? ''));
    const deadline = String(data.get('deadline') ?? '').trim();

    const errors = {};
    if (!name) errors.name = 'Name ist erforderlich.';
    if (!targetAmount || targetAmount <= 0) errors.targetAmount = 'Zielbetrag muss grösser als 0 sein.';

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, values: { name, targetAmount, deadline }, action: 'update' });
    }

    await updateSavingsGoal(id, locals.user.id, { name, targetAmount, deadline: deadline || null });
    return { success: 'Sparziel aktualisiert.' };
  },

  delete: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');
    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    await deleteSavingsGoal(id, locals.user.id);
    return { success: 'Sparziel gelöscht.' };
  }
};
