<script lang="ts">
	import { onMount } from 'svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import type { ArchiveEntry } from '$lib/types';
	import type { PageData } from './$types';

	const PAGE_SIZE = 5;

	let { data }: { data: PageData } = $props();
	let entries = $state<ArchiveEntry[]>([...data.entries]);
	let loading = $state(false);
	let exhausted = $state(data.entries.length < PAGE_SIZE);
	let sentinel: HTMLDivElement | undefined = $state();

	async function loadMore() {
		if (loading || exhausted) return;
		loading = true;

		try {
			const res = await fetch(`/api/entries?offset=${entries.length}&limit=${PAGE_SIZE}`);
			if (!res.ok) return;

			const { entries: batch } = (await res.json()) as { entries: ArchiveEntry[] };
			if (batch.length < PAGE_SIZE) exhausted = true;
			entries = [...entries, ...batch];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(items) => {
				if (items[0]?.isIntersecting) loadMore();
			},
			{ rootMargin: '400px' }
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

<main class="mx-auto max-w-6xl px-6 pb-24 pt-10 md:px-10 md:pt-14">
	<section class="mb-16">
		<div class="editorial-kicker mb-4">Continuous Feed</div>
		<h1 class="page-title">READING CURRENT</h1>
	</section>

	{#if entries.length}
		{#each entries as entry (entry.id)}
			<ArticleCard {entry} canBookmark={Boolean(data.user)} />
		{/each}

		{#if !exhausted}
			<div bind:this={sentinel} class="flex justify-center py-12">
				{#if loading}
					<span class="editorial-kicker animate-pulse">Loading…</span>
				{/if}
			</div>
		{/if}
	{:else if !data.user}
		<div class="surface-panel p-10">
			<div class="editorial-kicker mb-4">Not Signed In</div>
			<p class="max-w-xl font-body text-2xl leading-relaxed text-on-surface-variant">
				<a href="/login" class="text-primary-fixed underline">Sign in</a> to subscribe to feeds and see your reading stream here.
			</p>
		</div>
	{:else}
		<div class="surface-panel p-10">
			<div class="editorial-kicker mb-4">No Entries Yet</div>
			<p class="max-w-xl font-body text-2xl leading-relaxed text-on-surface-variant">
				<a href="/discover" class="text-primary-fixed underline">Add a source</a> to start populating your feed.
			</p>
		</div>
	{/if}
</main>
