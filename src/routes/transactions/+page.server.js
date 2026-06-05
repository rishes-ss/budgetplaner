import { fail, redirect } from '@sveltejs/kit';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '$lib/db.js';

export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  const transactions = await getTransactions(locals.user.id);
  return { transactions };
}

export const actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');

    const data = await request.formData();
    const title = String(data.get('title') ?? '').trim();
    const amount = parseFloat(String(data.get('amount') ?? ''));
    const type = String(data.get('type') ?? '');
    const category = String(data.get('category') ?? '').trim();
    const date = String(data.get('date') ?? '');
    const note = String(data.get('note') ?? '').trim();
    const isRecurring = data.get('isRecurring') === 'true';
    const recurrenceInterval = String(data.get('recurrenceInterval') ?? 'monthly');

    const errors = {};
    if (!title) errors.title = 'Titel ist erforderlich.';
    if (!amount || amount <= 0) errors.amount = 'Betrag muss grösser als 0 sein.';
    if (!category) errors.category = 'Kategorie ist erforderlich.';
    if (!date) errors.date = 'Datum ist erforderlich.';

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, values: { title, amount, type, category, date, note, isRecurring, recurrenceInterval }, action: 'create' });
    }

    await createTransaction(locals.user.id, { title, amount, type, category, date, note, isRecurring, recurrenceInterval });
    return { success: 'Transaktion wurde gespeichert.' };
  },

  update: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');

    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    const title = String(data.get('title') ?? '').trim();
    const amount = parseFloat(String(data.get('amount') ?? ''));
    const type = String(data.get('type') ?? '');
    const category = String(data.get('category') ?? '').trim();
    const date = String(data.get('date') ?? '');
    const note = String(data.get('note') ?? '').trim();
    const isRecurring = data.get('isRecurring') === 'true';
    const recurrenceInterval = String(data.get('recurrenceInterval') ?? 'monthly');

    const errors = {};
    if (!title) errors.title = 'Titel ist erforderlich.';
    if (!amount || amount <= 0) errors.amount = 'Betrag muss grösser als 0 sein.';
    if (!category) errors.category = 'Kategorie ist erforderlich.';

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, values: { id, title, amount, type, category, date, note, isRecurring, recurrenceInterval }, action: 'update' });
    }

    await updateTransaction(id, locals.user.id, { title, amount, type, category, date, note, isRecurring, recurrenceInterval });
    return { success: 'Transaktion wurde aktualisiert.' };
  },

  delete: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');
    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    await deleteTransaction(id, locals.user.id);
    return { success: 'Transaktion wurde gelöscht.' };
  }
};
