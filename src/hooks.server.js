import bcrypt from 'bcryptjs';
import { getSession, getUserById, ensureAdminExists } from '$lib/db.js';
import { ADMIN_PASSWORD } from '$env/static/private';

let adminReady = false;

async function initAdmin() {
  if (adminReady) return;
  adminReady = true;
  try {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await ensureAdminExists(hash);
  } catch (err) {
    console.error('Admin init error:', err);
  }
}

export async function handle({ event, resolve }) {
  await initAdmin();

  const sessionId = event.cookies.get('bp_session');

  if (sessionId) {
    try {
      const session = await getSession(sessionId);
      if (session) {
        const user = await getUserById(session.userId);
        if (user) {
          event.locals.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role ?? 'user'
          };
        }
      }
    } catch (err) {
      console.error('Session load error:', err);
    }
  }

  return resolve(event);
}
