<script lang="ts">
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function featured() {
		return data.entries[0];
	}

	function remainder() {
		return data.entries.slice(1);
	}
</script>

<main class="mx-auto max-w-6xl px-6 pb-20 pt-10 md:px-10 md:pt-14">
	<section class="grid gap-10 md:grid-cols-12">
		<div class="md:col-span-8">
			<div class="editorial-kicker mb-5 flex items-center gap-3">
				<div class="h-px w-8 bg-primary-fixed"></div>
				Collected Dispatch
			</div>
			<h1 class="page-title">
				LATEST ENTRIES <span class="text-primary-fixed">.</span>
			</h1>
			<p class="mt-6 max-w-2xl font-body text-2xl leading-relaxed text-on-surface-variant">
				A chronologically curated sequence of articles, essays, and reports filtered for depth
				and relevance.
			</p>
		</div>
		<div class="md:col-span-4 md:text-right">
			<div class="font-label text-4xl font-light text-outline">03.26</div>
			<div class="font-label text-[10px] uppercase tracking-[0.22rem] text-secondary">
				Vol. 1 // ARCHIVE
			</div>
			{#if !data.user}
				<p class="mt-6 max-w-xs font-body text-lg italic text-on-surface-variant md:ml-auto">
					<a href="/login" class="text-primary-fixed underline">Sign in</a> to start building your personal archive.
				</p>
			{/if}
		</div>
	</section>

	{#if featured()}
		<section class="mt-16">
			<ArticleCard entry={featured()} canBookmark={Boolean(data.user)} featured />
		</section>
	{/if}

	<section class="mt-10">
		{#each remainder() as entry}
			<ArticleCard entry={entry} canBookmark={Boolean(data.user)} />
		{/each}
	</section>
</main>
