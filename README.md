# ARCHIVE

Editorial RSS reader built with SvelteKit 2, Cloudflare Workers, D1, Drizzle ORM, UnoCSS, Google OAuth via Arctic, and OpenRouter-powered homepage digests.

## Stack

- SvelteKit 2 with Svelte 5 runes
- Cloudflare Workers adapter
- D1 database with Drizzle ORM
- UnoCSS with an editorial token system derived from `DESIGN-SYSTEM.MD`
- Google OAuth using Arctic
- OpenRouter for AI-generated homepage digests
- `bun` for package management and scripts

## Local Setup

1. Create the D1 database:

```sh
wrangler d1 create rsseeder-db
```

2. Copy the returned `database_id` into [wrangler.jsonc](/home/xniffing/Projects/rsseeder/wrangler.jsonc).

3. Copy the local env template and fill in your values:

```sh
cp .dev.vars.example .dev.vars
```

Required local variables:

- `GOOGLE_CLIENT_ID=your-google-client-id`
- `GOOGLE_CLIENT_SECRET=your-google-client-secret`
- `GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback`
- `CRON_SECRET=generate-a-random-secret`
- `OPENROUTER_API_KEY=your-openrouter-api-key`
- optional: `OPENROUTER_MODEL=openai/gpt-4o-mini`

For production, set the same values with Wrangler vars/secrets and keep the D1 binding in [wrangler.jsonc](/home/xniffing/Projects/rsseeder/wrangler.jsonc).

`OPENROUTER_API_KEY` should be configured as a Wrangler secret. The hourly cron sync uses it to precompute the homepage digest for each user.

4. Apply migrations and start the app:

```sh
bun run db:migrate:local
bun run preview
```

Google auth requires the Cloudflare runtime because it depends on the `DB` binding. `bun run dev`
is fine for UI work, but OAuth and other authenticated flows need `bun run preview`.

## Scripts

- `bun run dev`
- `bun run build`
- `bun run preview`
- `bun run check`
- `bun run db:generate`
- `bun run db:migrate:local`
- `bun run db:migrate:remote`
- `bun run db:seed`
- `bun run deploy`

## Notes

- Without D1 or Google configured, the UI falls back to demo archive content for browsing.
- The homepage digest is grouped globally across sources by category, with a secondary type label for each cluster.
- Digest generation is precomputed during the hourly cron sync and stored in D1.
- Mutating features such as feed ingest, sync, and bookmarks require authentication and a bound D1 database.
