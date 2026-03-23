import { redirect } from '@sveltejs/kit';
import {
	createGoogleAuthRequest,
	createGoogleClientForRequest,
	isAuthConfigured,
	setGoogleAuthCookies
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, platform, url }) => {
	if (!platform || !isAuthConfigured(platform.env)) {
		throw redirect(302, '/login');
	}

	const redirectUri = `${url.origin}/auth/google/callback`;
	const google = createGoogleClientForRequest(platform.env, redirectUri);
	const { state, codeVerifier } = createGoogleAuthRequest();
	const authorizationURL = google.createAuthorizationURL(state, codeVerifier, [
		'openid',
		'profile',
		'email'
	]);

	setGoogleAuthCookies(cookies, state, codeVerifier, url.protocol === 'https:');

	throw redirect(302, authorizationURL.toString());
};
