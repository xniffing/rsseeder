# AGENTS.md

Guidance for coding agents working in this repository.

## Project summary

`rsseeder` is an editorial RSS reader branded as **ARCHIVE**.

It is built with:
- SvelteKit 2
- Svelte 5 runes
- Cloudflare Workers adapter
- Cloudflare D1 + Drizzle ORM
- UnoCSS
- Google OAuth via Arctic
- bun for package management and scripts

The app supports:
- subscribing to RSS/Atom feeds
- ingesting and syncing entries
- bookmarking entries
- reading entries in a markdown-rendered article view
- an hourly cron sync on Cloudflare
- demo/fallback browsing when auth or DB is unavailable

## Important repo rules

- Use `bun`, not npm/yarn/pnpm.
- Prefer `bun run preview` for runtime testing. `bun run dev` is okay for UI-only work, but auth and D1-backed flows require the Cloudflare runtime.
- Do **not** remove the post-build scheduled handler injection unless replacing it with an intentional Cloudflare-native scheduled solution.
- Preserve the editorial visual language defined in `DESIGN-SYSTEM.MD`.
- Keep components square, restrained, typographic, and monochrome-first with deep red accents.
- Be careful with security-sensitive code in feed fetching, auth, and cron routes.

## Current working tree note

Before making changes, check `git status`. At the time of review there were already user changes in:
- `README.md`
- `.dev.vars.example`

Do not overwrite user changes unless explicitly asked.

## Commands

Primary commands from `package.json`:

```sh
bun run dev
bun run build
bun run preview
bun run check
bun run db:generate
bun run db:migrate:local
bun run db:migrate:remote
bun run db:seed
bun run deploy
```

Recommended validation after edits:

```sh
bun run check
```

## Runtime and environment

### Local env
Copy `.dev.vars.example` to `.dev.vars`.

Required vars/secrets:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `CRON_SECRET`

### Cloudflare bindings
Configured in `wrangler.jsonc`:
- D1 binding: `DB`
- hourly cron: `0 * * * *`

### Important runtime behavior
- `src/app.d.ts` types the Cloudflare env.
- `hooks.server.ts` reads session cookies and populates `event.locals.user`.
- OAuth and DB-backed functionality require `platform.env.DB`.
- When DB or auth is missing, many page loaders fall back to demo data or empty authenticated state.

## Architecture map

### App shell
- `src/routes/+layout.svelte` — global shell, fonts, service worker registration, header, bottom nav
- `src/routes/+layout.server.ts` — exposes `user` and `googleEnabled`
- `src/hooks.server.ts` — CSRF check, session validation, security headers

### Pages
- `src/routes/+page.*` — latest entries landing page
- `src/routes/feed/+page.*` — paginated feed view
- `src/routes/library/+page.*` — subscribed sources
- `src/routes/discover/+page.*` — add-feed flow
- `src/routes/saved/+page.*` — bookmarks
- `src/routes/entry/[id]/+page.*` — article reader, marks entry as read on load
- `src/routes/login/+page.svelte` — login/configuration state

### API routes
- `src/routes/api/feeds/+server.ts` — list/add feeds
- `src/routes/api/feeds/[id]/+server.ts` — delete feed
- `src/routes/api/feeds/[id]/sync/+server.ts` — sync one feed
- `src/routes/api/entries/+server.ts` — paginated feed entries
- `src/routes/api/bookmarks/+server.ts` — add bookmark
- `src/routes/api/bookmarks/[entryId]/+server.ts` — remove bookmark
- `src/routes/api/cron/sync/+server.ts` — protected cron sync endpoint

### Server library
- `src/lib/server/archive.ts` — main domain logic for fetching, parsing, enriching, querying, syncing, and bookmarks
- `src/lib/server/auth.ts` — Google OAuth, sessions, cookies
- `src/lib/server/db/index.ts` — Drizzle D1 factory
- `src/lib/server/db/schema.ts` — schema definitions
- `src/lib/server/demo.ts` — demo data
- `src/lib/server/rate-limit.ts` — in-memory rate limiting
- `src/lib/server/errors.ts` — safe client-facing error filtering

### UI/components
- `src/lib/components/ArticleCard.svelte`
- `src/lib/components/SourceCard.svelte`
- `src/lib/components/FeedAddForm.svelte`
- `src/lib/components/BookmarkButton.svelte`
- `src/lib/components/SyncButton.svelte`
- `src/lib/components/AppHeader.svelte`
- `src/lib/components/BottomNav.svelte`

### Styling
- `uno.config.ts` — theme tokens + shortcuts
- `DESIGN-SYSTEM.MD` — source of truth for product/design direction

### Build/runtime extras
- `scripts/inject-scheduled.js` — patches the generated Cloudflare worker after build to add `scheduled()`
- `static/sw.js` — service worker
- `migrations/` — raw SQL migrations

## Data model

Defined in `src/lib/server/db/schema.ts`:
- `users`
- `sessions`
- `feeds`
- `entries`
- `bookmarks`

Notable constraints:
- unique Google ID and email on `users`
- unique `(userId, feedUrl)` on `feeds`
- unique `sourceKey` on `entries`
- unique `(userId, entryId)` on `bookmarks`

Entry records include both:
- `contentText`
- `contentMarkdown`

`content_markdown` was added in `migrations/0002_entry_markdown.sql`.

## Feed ingestion and content pipeline

The main logic lives in `src/lib/server/archive.ts`.

### Feed support
- RSS and Atom are both supported.
- XML parsing uses `fast-xml-parser`.
- Feed/item fields are normalized into internal `ArchiveFeed` and `ArchiveEntry` shapes.

### SSRF protections
Feed/article fetching is guarded by `validateExternalUrl()` and `safeFetch()`.
Do not weaken these protections.

Blocked patterns include:
- localhost
- `.local` / `.internal`
- private IPv4 ranges
- local IPv6 ranges
- non-http(s) protocols

### Article enrichment
If a feed item has thin content, the app may fetch the linked article page and try to extract a better article body.

Relevant helpers:
- `shouldHydrateFromArticle()`
- `fetchArticleContent()`
- `extractArticleTextFromHtml()`
- `htmlToMarkdown()`

This logic is heuristic and intentionally lightweight. If you change it, preserve:
- safe external fetching
- graceful fallback on failure
- markdown generation compatibility with the reader page

## Markdown rendering

`src/lib/markdown.ts` converts stored markdown to sanitized HTML using:
- `remark-parse`
- `remark-gfm`
- `remark-math`
- `remark-rehype`
- `rehype-katex`
- `rehype-sanitize`
- `rehype-stringify`

Important behavior:
- links/images are rebased against the article URL
- links open in a new tab with rel protection
- images are lazy-loaded and use `referrerpolicy="no-referrer"`
- KaTeX tags/classes are explicitly allowed in the sanitize schema

Do not bypass sanitization when rendering article content.

## Auth and session flow

Implemented in `src/lib/server/auth.ts` and auth routes.

### OAuth flow
- `/auth/google` creates state + PKCE verifier and redirects to Google
- `/auth/google/callback` validates state/verifier, exchanges code, fetches profile, upserts user, creates session
- `/auth/logout` deletes session and clears cookie

### Sessions
- cookie name: `archive_session`
- session table: `sessions`
- session lifetime: 30 days
- sliding refresh: rotate when less than 7 days remain

## Security notes

### CSRF / origin checks
`src/hooks.server.ts` rejects cross-origin mutating requests.

Special case:
- origin-less mutating requests are allowed only when they include `x-cron-secret`

### Cron sync protection
`src/routes/api/cron/sync/+server.ts`:
- requires `x-cron-secret`
- compares secrets with a timing-safe function
- rate-limits requests

### Rate limiting
Current limits are isolate-local in-memory limits. They are best-effort only on Cloudflare Workers.
If stronger guarantees are needed, use Cloudflare-native rate limiting.

## UI and styling conventions

Read `DESIGN-SYSTEM.MD` before making major UI changes.

High-level rules:
- hard edges by default
- minimal shadows
- large editorial spacing
- Space Grotesk for labels/headlines/navigation
- Newsreader for summaries/body copy
- red is a restrained signal color, not a general accent wash
- avoid colorful dashboard/SaaS aesthetics
- keep mobile bottom nav intact for primary navigation

UnoCSS shortcuts in `uno.config.ts` are the preferred shared styling vocabulary.
Reuse existing shortcuts like:
- `primary-button`
- `secondary-button`
- `editorial-kicker`
- `page-title`
- `surface-panel`

## Svelte conventions in this repo

- The project uses Svelte 5 runes (`$state`, `$effect`, etc.).
- Keep page data loading in `+page.server.ts` when data depends on DB/auth.
- Use `invalidateAll()` after mutations when the UI should refresh server-loaded data.
- Keep API responses JSON and consistent with existing route patterns.
- Match the current simple component style instead of introducing new state libraries.

## Known issues / review notes

Running `bun run check` during review produced 0 errors and 2 warnings:
- `src/routes/feed/+page.svelte` captures the initial `data.entries` values into `$state` and triggers Svelte warnings about referencing initial prop values locally.

This is not currently a type error, but if you touch that page, consider refactoring to avoid stale prop capture.

## Change guidance for future agents

When adding features:
1. Decide whether the feature belongs in a page load, API route, or shared server helper.
2. Keep DB access inside server code.
3. Reuse `archive.ts` domain helpers when possible instead of duplicating query logic.
4. Preserve fallback behavior for missing DB/auth unless the product direction explicitly changes.
5. Run `bun run check` after changes.

When changing schema:
1. Update `src/lib/server/db/schema.ts`
2. Generate or add a migration
3. Ensure D1 SQL stays compatible
4. Check any JSON parsing/stringifying assumptions like `tagsJson`

When changing cron/build behavior:
1. Inspect `scripts/inject-scheduled.js`
2. Confirm `bun run build` still produces a worker with the scheduled handler
3. Keep the cron endpoint secret-protected

When changing feed fetching/parsing:
1. Preserve SSRF safeguards
2. Preserve graceful fallback for broken feeds/articles
3. Avoid leaking internal errors to clients; use `safeErrorMessage()` patterns

## Recommended first reads for new agents

1. `README.md`
2. `DESIGN-SYSTEM.MD`
3. `package.json`
4. `src/lib/server/archive.ts`
5. `src/lib/server/auth.ts`
6. `src/hooks.server.ts`
7. `uno.config.ts`

## Files to inspect before major edits

- auth/session work: `src/lib/server/auth.ts`, `src/hooks.server.ts`, auth routes
- feed ingest/sync work: `src/lib/server/archive.ts`, feeds API routes
- UI restyling: `DESIGN-SYSTEM.MD`, `uno.config.ts`, shared components
- DB work: `src/lib/server/db/schema.ts`, `migrations/`, `drizzle.config.ts`
- deployment/runtime work: `wrangler.jsonc`, `scripts/inject-scheduled.js`, `src/app.d.ts`
