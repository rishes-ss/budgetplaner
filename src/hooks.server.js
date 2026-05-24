import { getSession, getUserById } from '$lib/db.js';

export async function handle({ event, resolve }) {
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
            email: user.email
          };
        }
      }
    } catch (err) {
      console.error('Session load error:', err);
    }
  }

  return resolve(event);
}
