<script lang="ts">
	import SourceCard from '$lib/components/SourceCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function primaryFeeds() {
		return data.feeds.slice(0, 3);
	}

	function secondaryFeeds() {
		return data.feeds.slice(3);
	}
</script>

<main class="mx-auto max-w-7xl px-6 pb-24 pt-10 md:px-10 md:pt-14">

	<section class="grid gap-8 md:grid-cols-12 md:items-end">
		<div class="md:col-span-8">
			<div class="editorial-kicker mb-4">Repository / Sources</div>
			<h1 class="page-title">CURATED COLLECTIONS</h1>
			<p class="mt-6 max-w-2xl font-body text-2xl leading-relaxed text-on-surface-variant">
				A clinical inventory of your digital subscriptions. Sources are archived by
				intellectual weight and chronological relevance.
			</p>
		</div>
		<div class="md:col-span-4 md:flex md:justify-end">
			<a href="/discover" class="primary-button">Add New Source</a>
		</div>
	</section>

	<div class="mt-12 flex gap-3 overflow-x-auto pb-2">
		<button class="bg-surface-container-highest px-5 py-2 font-label text-[10px] uppercase tracking-[0.18rem]">
			All Sources ({data.feeds.length})
		</button>
		{#each [...new Set(data.feeds.map((feed) => feed.category))].slice(0, 4) as category}
			<div class="bg-surface-container px-5 py-2 font-label text-[10px] uppercase tracking-[0.18rem] text-on-surface-variant">
				{category}
			</div>
		{/each}
	</div>

	<section class="mt-14 space-y-8">
		{#each primaryFeeds() as feed}
			<SourceCard feed={feed} canSync={Boolean(data.user)} featured />
		{/each}
	</section>

	{#if secondaryFeeds().length}
		<section class="mt-18">
			<div class="mb-6 border-b border-outline-variant/40 pb-3 font-label text-[10px] uppercase tracking-[0.28rem] text-secondary">
				02 — JOURNALS
			</div>
			<div>
				{#each secondaryFeeds() as feed}
					<div class="grid gap-5 border-b border-outline-variant/30 py-8 md:grid-cols-12 md:items-center">
						<div class="md:col-span-7">
							<div class="editorial-kicker">{feed.category}</div>
							<h3 class="mt-3 font-headline text-3xl font-bold tracking-[-0.05em]">{feed.title}</h3>
							<p class="mt-2 font-body text-lg italic text-on-surface-variant">{feed.description}</p>
						</div>
						<div class="md:col-span-3 font-label text-xs uppercase tracking-[0.16rem] text-secondary">
							{feed.totalEntries} entries • {feed.unreadCount} unread
						</div>
						<div class="flex justify-start md:col-span-2 md:justify-end">
							<a href={feed.siteUrl} class="secondary-button">Open Site</a>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</main>
