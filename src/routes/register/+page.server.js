import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, createSession } from '$lib/db.js';

export function load({ locals }) {
  if (locals.user) throw redirect(303, '/');
}

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim();
    const username = String(data.get('username') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const confirm = String(data.get('confirm') ?? '');

    const errors = {};
    if (!email) errors.email = 'E-Mail ist erforderlich.';
    if (!username || username.length < 2) errors.username = 'Benutzername muss mind. 2 Zeichen haben.';
    if (!password || password.length < 6) errors.password = 'Passwort muss mind. 6 Zeichen haben.';
    if (password !== confirm) errors.confirm = 'Passwörter stimmen nicht überein.';

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, email, username });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return fail(400, { errors: { email: 'Diese E-Mail ist bereits registriert.' }, email, username });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await createUser(email, username, passwordHash);

    const sessionId = await createSession(userId);
    cookies.set('bp_session', sessionId, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });

    throw redirect(303, '/');
  }
};
