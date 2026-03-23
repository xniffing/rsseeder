<script lang="ts">
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="mx-auto max-w-6xl px-6 pb-24 pt-10 md:px-10 md:pt-14">
	<section class="mb-16">
		<div class="editorial-kicker mb-4">Saved / Bookmarks</div>
		<h1 class="page-title">KEPT FOR LATER</h1>
		<p class="mt-6 max-w-2xl font-body text-2xl leading-relaxed text-on-surface-variant">
			A deliberately small shelf of entries marked for return, quotation, or deeper attention.
		</p>
	</section>

	{#if data.entries.length}
		{#each data.entries as entry}
			<ArticleCard entry={entry} canBookmark={Boolean(data.user)} />
		{/each}
	{:else if !data.user}
		<div class="surface-panel p-10">
			<div class="editorial-kicker mb-4">Not Signed In</div>
			<p class="max-w-xl font-body text-2xl leading-relaxed text-on-surface-variant">
				<a href="/login" class="text-primary-fixed underline">Sign in</a> to bookmark articles and build your reading shelf.
			</p>
		</div>
	{:else}
		<div class="surface-panel p-10">
			<div class="editorial-kicker mb-4">No Saved Entries</div>
			<p class="max-w-xl font-body text-2xl leading-relaxed text-on-surface-variant">
				Bookmark an article from the feed or latest view and it will appear here.
			</p>
		</div>
	{/if}
</main>
