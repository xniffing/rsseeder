# ARCHIVE

Editorial RSS reader built with SvelteKit 2, Cloudflare Workers, D1, Drizzle ORM, UnoCSS, and Google OAuth via Arctic.

## Stack

- SvelteKit 2 with Svelte 5 runes
- Cloudflare Workers adapter
- D1 database with Drizzle ORM
- UnoCSS with an editorial token system derived from `DESIGN-SYSTEM.MD`
- Google OAuth using Arctic
- `bun` for package management and scripts

## Local Setup

1. Create the D1 database:

```sh
wrangler d1 create rsseeder-db
```

2. Copy the returned `database_id` into [wrangler.jsonc](/home/xniffing/Projects/rsseeder/wrangler.jsonc).

3. Add local secrets to `.dev.vars`:

```sh
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

4. Configure public Google vars in [wrangler.jsonc](/home/xniffing/Projects/rsseeder/wrangler.jsonc) or in your local Wrangler env:

- `GOOGLE_CLIENT_ID=your-google-client-id`
- `GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback`

5. Apply migrations and start the app:

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
- Mutating features such as feed ingest, sync, and bookmarks require authentication and a bound D1 database.
