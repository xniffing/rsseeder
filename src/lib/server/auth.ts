import { Google, generateCodeVerifier, generateState } from 'arctic';
import { and, eq, sql } from 'drizzle-orm';
import { getDb } from './db';
import { sessions, users } from './db/schema';
import type { ArchiveUser } from '$lib/types';

const SESSION_COOKIE = 'archive_session';
const GOOGLE_STATE_COOKIE = 'google_oauth_state';
const GOOGLE_VERIFIER_COOKIE = 'google_oauth_verifier';

export function createGoogleClient(env: App.Platform['env']) {
	return new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
}

export function createGoogleClientForRequest(
	env: App.Platform['env'],
	redirectUri?: string
) {
	return new Google(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		redirectUri ?? env.GOOGLE_REDIRECT_URI
	);
}

export function isGoogleConfigured(env?: Partial<App.Platform['env']>) {
	return Boolean(env?.GOOGLE_CLIENT_ID && env?.GOOGLE_CLIENT_SECRET);
}

export function isDatabaseConfigured(env?: Partial<App.Platform['env']>) {
	return Boolean(env?.DB);
}

export function isAuthConfigured(env?: Partial<App.Platform['env']>) {
	return isGoogleConfigured(env) && isDatabaseConfigured(env);
}

export function newId(prefix: string) {
	return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`;
}

export function createGoogleAuthRequest() {
	return {
		state: generateState(),
		codeVerifier: generateCodeVerifier()
	};
}

export function setGoogleAuthCookies(
	cookies: Pick<import('@sveltejs/kit').Cookies, 'set'>,
	state: string,
	codeVerifier: string,
	secure: boolean
) {
	const options = {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure,
		maxAge: 60 * 10
	};

	cookies.set(GOOGLE_STATE_COOKIE, state, options);
	cookies.set(GOOGLE_VERIFIER_COOKIE, codeVerifier, options);
}

export function clearGoogleAuthCookies(cookies: Pick<import('@sveltejs/kit').Cookies, 'delete'>) {
	cookies.delete(GOOGLE_STATE_COOKIE, { path: '/' });
	cookies.delete(GOOGLE_VERIFIER_COOKIE, { path: '/' });
}

export function readGoogleAuthCookies(
	cookies: Pick<import('@sveltejs/kit').Cookies, 'get'>
): { state: string | undefined; codeVerifier: string | undefined } {
	return {
		state: cookies.get(GOOGLE_STATE_COOKIE),
		codeVerifier: cookies.get(GOOGLE_VERIFIER_COOKIE)
	};
}

export async function upsertGoogleUser(
	db: ReturnType<typeof getDb>,
	profile: { googleId: string; email: string; name: string; avatar: string | null }
) {
	const existing = await db.select().from(users).where(eq(users.googleId, profile.googleId)).limit(1);
	const now = new Date().toISOString();

	if (existing[0]) {
		await db
			.update(users)
			.set({
				email: profile.email,
				name: profile.name,
				avatar: profile.avatar
			})
			.where(eq(users.id, existing[0].id));

		return existing[0].id;
	}

	const id = newId('user');
	await db.insert(users).values({
		id,
		googleId: profile.googleId,
		email: profile.email,
		name: profile.name,
		avatar: profile.avatar,
		createdAt: now
	});

	return id;
}

export async function createSession(db: ReturnType<typeof getDb>, userId: string) {
	const id = newId('session');
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

	await db.insert(sessions).values({ id, userId, expiresAt });

	return { id, expiresAt };
}

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 7; // refresh if < 7 days remaining

export async function validateSession(
	db: ReturnType<typeof getDb>,
	sessionId: string
): Promise<{ user: ArchiveUser; refreshedSession: { id: string; expiresAt: string } | null } | null> {
	const rows = await db
		.select({ session: sessions, user: users })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId))
		.limit(1);

	const row = rows[0];
	if (!row) {
		return null;
	}

	const expiresAt = new Date(row.session.expiresAt).getTime();

	if (expiresAt <= Date.now()) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
		return null;
	}

	const user: ArchiveUser = {
		id: row.user.id,
		email: row.user.email,
		name: row.user.name,
		avatar: row.user.avatar
	};

	// Sliding expiration: rotate session if less than 7 days remaining
	const remaining = expiresAt - Date.now();
	if (remaining < SESSION_REFRESH_THRESHOLD_MS) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
		const newSession = await createSession(db, user.id);
		return { user, refreshedSession: newSession };
	}

	return { user, refreshedSession: null };
}

export async function deleteSession(db: ReturnType<typeof getDb>, sessionId: string) {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function purgeExpiredSessions(db: ReturnType<typeof getDb>) {
	const result = await db
		.delete(sessions)
		.where(sql`${sessions.expiresAt} <= datetime('now')`);
	return result;
}

export function setSessionCookie(
	cookies: Pick<import('@sveltejs/kit').Cookies, 'set'>,
	session: { id: string; expiresAt: string },
	secure: boolean
) {
	cookies.set(SESSION_COOKIE, session.id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		expires: new Date(session.expiresAt)
	});
}

export function clearSessionCookie(cookies: Pick<import('@sveltejs/kit').Cookies, 'delete'>) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function readSessionCookie(cookies: Pick<import('@sveltejs/kit').Cookies, 'get'>) {
	return cookies.get(SESSION_COOKIE);
}

export async function fetchGoogleProfile(accessToken: string) {
	const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!response.ok) {
		throw new Error('Unable to fetch Google profile');
	}

	const payload = (await response.json()) as {
		sub: string;
		email: string;
		name: string;
		picture?: string;
	};

	return {
		googleId: payload.sub,
		email: payload.email,
		name: payload.name,
		avatar: payload.picture ?? null
	};
}
