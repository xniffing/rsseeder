<script lang="ts">
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="mx-auto max-w-6xl px-6 pb-24 pt-10 md:px-10 md:pt-14">
	<section class="mb-16 flex flex-wrap items-end justify-between gap-8">
		<div>
			<div class="editorial-kicker mb-4">Continuous Feed</div>
			<h1 class="page-title">READING CURRENT</h1>
			<p class="mt-6 max-w-2xl font-body text-2xl leading-relaxed text-on-surface-variant">
				Every indexed article in one stream, ordered by publication time and styled for
				deliberate browsing.
			</p>
		</div>
		<a href="/discover" class="primary-button">Add New Source</a>
	</section>

	{#each data.entries as entry}
		<ArticleCard entry={entry} canBookmark={Boolean(data.user)} />
	{/each}
</main>
