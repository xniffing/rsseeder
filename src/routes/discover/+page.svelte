<script lang="ts">
	import FeedAddForm from '$lib/components/FeedAddForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="mx-auto max-w-5xl px-6 pb-24 pt-10 md:px-10 md:pt-14">
	<section class="mb-14">
		<div class="editorial-kicker mb-4">Discover / Add Feed</div>
		<h1 class="page-title">EXPAND THE ARCHIVE</h1>
		<p class="mt-6 max-w-3xl font-body text-2xl leading-relaxed text-on-surface-variant">
			Bring in new RSS and Atom sources through a direct URL. Recommendations below are
			editorial prompts, while the form indexes real feeds into your library.
		</p>
	</section>

	<FeedAddForm canEdit={Boolean(data.user)} />

	<section class="mt-18">
		<div class="mb-8 flex items-end justify-between gap-6">
			<div>
				<div class="editorial-kicker mb-3">Curated Archives</div>
				<h2 class="font-headline text-4xl font-bold tracking-[-0.05em]">Recommended for You</h2>
			</div>
			<div class="font-label text-[10px] uppercase tracking-[0.18rem] text-secondary">
				{data.currentFeeds.length} sources in library
			</div>
		</div>

		<div class="space-y-0">
			{#each data.recommendations as recommendation}
				<div class="grid gap-6 border-b border-outline-variant/30 py-8 md:grid-cols-12 md:items-center">
					<div class="md:col-span-8">
						<div class="editorial-kicker">{recommendation.category}</div>
						<h3 class="mt-3 font-headline text-3xl font-bold tracking-[-0.05em]">
							{recommendation.title}
						</h3>
						<p class="mt-2 font-body text-xl leading-relaxed text-on-surface-variant">
							{recommendation.description}
						</p>
					</div>
					<div class="md:col-span-2 font-label text-xs uppercase tracking-[0.16rem] text-secondary">
						{recommendation.subscribers} readers
					</div>
					<div class="md:col-span-2 md:text-right">
						<a href={recommendation.suggestionUrl} class="secondary-button">Inspect Feed</a>
					</div>
				</div>
			{/each}
		</div>
	</section>
</main>
