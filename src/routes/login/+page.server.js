import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createSession } from '$lib/db.js';

export function load({ locals }) {
  if (locals.user) throw redirect(303, '/');
}

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '');
    const password = String(data.get('password') ?? '');

    if (!email || !password) {
      return fail(400, { error: 'Bitte alle Felder ausfüllen.', email });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return fail(400, { error: 'E-Mail oder Passwort falsch.', email });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return fail(400, { error: 'E-Mail oder Passwort falsch.', email });
    }

    const sessionId = await createSession(user._id);
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
