import { fail, redirect } from '@sveltejs/kit';
import { getAllUsers, deleteUser, getUserById } from '$lib/db.js';

export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (locals.user.role !== 'admin') throw redirect(303, '/');

  const users = await getAllUsers();
  return { users };
}

export const actions = {
  deleteUser: async ({ locals, request }) => {
    if (!locals.user || locals.user.role !== 'admin') {
      return fail(403, { error: 'Nicht autorisiert.' });
    }

    const data = await request.formData();
    const id = String(data.get('id') ?? '').trim();

    if (!id) return fail(400, { error: 'Ungültige Benutzer-ID.' });
    if (id === locals.user.id) return fail(400, { error: 'Du kannst dich nicht selbst löschen.' });

    const userToDelete = await getUserById(id);
    if (!userToDelete) return fail(404, { error: 'Benutzer nicht gefunden.' });
    if (userToDelete.role === 'admin') return fail(403, { error: 'Admin-Konten können nicht gelöscht werden.' });

    try {
      await deleteUser(id);
    } catch {
      return fail(500, { error: 'Fehler beim Löschen des Benutzers.' });
    }

    return { success: true };
  }
};
