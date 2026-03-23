<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="min-h-screen bg-background px-6 py-16">
	<div class="mx-auto grid max-w-5xl gap-12 md:grid-cols-12 md:items-center">
		<div class="md:col-span-7">
			<div class="editorial-kicker mb-4">Authentication / Google</div>
			<h1 class="page-title">ENTER THE ARCHIVE</h1>
			<p class="mt-6 max-w-2xl font-body text-2xl leading-relaxed text-on-surface-variant">
				Sign in to save feeds, sync sources, and maintain a personal reading shelf inside the
				archive.
			</p>
		</div>

		<div class="surface-panel md:col-span-5 p-8 md:p-10">
			<div class="editorial-kicker mb-4">Account Access</div>
			<h2 class="font-headline text-3xl font-bold tracking-[-0.05em]">Google OAuth</h2>
			<p class="mt-4 font-body text-xl leading-relaxed text-on-surface-variant">
				The first release uses Google sign-in. Configure Cloudflare vars and secrets to turn
				this on in local preview and deploys.
			</p>

			{#if data.googleEnabled}
				<a href="/auth/google" class="primary-button mt-8 w-full">Continue with Google</a>
			{:else}
				<div class="mt-8 border border-outline-variant/60 bg-surface-container p-4">
					<p class="font-label text-xs uppercase tracking-[0.18rem] text-secondary">
						Google auth is not configured yet.
					</p>
					<p class="mt-3 font-body text-sm leading-relaxed text-on-surface-variant">
						Start the app with `bun run preview` and make sure the D1 binding plus Google
						credentials are configured in Wrangler.
					</p>
				</div>
			{/if}

			<a href="/" class="secondary-button mt-4 w-full">Browse Demo Archive</a>
		</div>
	</div>
</main>
