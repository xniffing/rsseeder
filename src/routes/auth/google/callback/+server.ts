import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import {
	clearGoogleAuthCookies,
	createGoogleClientForRequest,
	createSession,
	fetchGoogleProfile,
	isAuthConfigured,
	readGoogleAuthCookies,
	setSessionCookie,
	upsertGoogleUser
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, platform, url }) => {
	if (!platform || !isAuthConfigured(platform.env)) {
		throw redirect(302, '/login');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const oauthCookies = readGoogleAuthCookies(cookies);

	if (!code || !state || state !== oauthCookies.state || !oauthCookies.codeVerifier) {
		clearGoogleAuthCookies(cookies);
		throw redirect(302, '/login');
	}

	const redirectUri = `${url.origin}/auth/google/callback`;
	const google = createGoogleClientForRequest(platform.env, redirectUri);
	const tokens = await google.validateAuthorizationCode(code, oauthCookies.codeVerifier);
	const profile = await fetchGoogleProfile(tokens.accessToken());
	const db = getDb(platform.env.DB);
	const userId = await upsertGoogleUser(db, profile);
	const session = await createSession(db, userId);

	clearGoogleAuthCookies(cookies);
	setSessionCookie(cookies, session, url.protocol === 'https:');

	throw redirect(302, '/');
};
