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
			Bring in new RSS and Atom sources through a direct URL.
		</p>
	</section>

	<FeedAddForm canEdit={Boolean(data.user)} />
</main>
