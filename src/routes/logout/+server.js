import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/db.js';

export async function GET({ cookies }) {
  const sessionId = cookies.get('bp_session');
  if (sessionId) {
    await deleteSession(sessionId).catch(() => {});
    cookies.delete('bp_session', { path: '/' });
  }
  throw redirect(303, '/login');
}
