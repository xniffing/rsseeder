/// <reference types="@cloudflare/workers-types" />

declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				email: string;
				name: string;
				avatar: string | null;
			} | null;
		}

		interface Platform {
			ctx: ExecutionContext;
			env: {
				DB: D1Database;
				GOOGLE_CLIENT_ID: string;
				GOOGLE_CLIENT_SECRET: string;
				GOOGLE_REDIRECT_URI: string;
				CRON_SECRET: string;
			};
		}
	}
}

export {};
