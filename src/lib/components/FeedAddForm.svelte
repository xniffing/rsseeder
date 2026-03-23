<script lang="ts">
	import { goto } from '$app/navigation';

	let {
		canEdit = false
	}: {
		canEdit?: boolean;
	} = $props();

	let url = $state('');
	let category = $state('');
	let pending = $state(false);
	let errorMessage = $state('');

	async function submit() {
		if (!canEdit) {
			await goto('/login');
			return;
		}

		pending = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/feeds', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ url, category })
			});

			if (!response.ok) {
				const payload = (await response.json()) as { error?: string };
				throw new Error(payload.error ?? 'Unable to add feed');
			}

			await goto('/library');
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unable to add feed';
		} finally {
			pending = false;
		}
	}
</script>

<div class="surface-panel p-8 md:p-12">
	<div class="max-w-2xl">
		<div class="editorial-kicker mb-4">Manual Integration</div>
		<h3 class="font-headline text-3xl font-bold tracking-[-0.05em]">Connect a Feed by URL</h3>
		<p class="mt-4 max-w-xl font-body text-xl leading-relaxed text-on-surface-variant">
			Paste any RSS or Atom endpoint. ARCHIVE will fetch it immediately, index the source, and
			pull in its current entries.
		</p>

		<div class="mt-8 grid gap-4 md:grid-cols-[1fr_220px]">
			<input
				bind:value={url}
				class="w-full border-0 border-b border-outline bg-transparent px-0 py-4 font-body text-2xl italic outline-none"
				placeholder="https://publication.com/feed.xml"
			/>
			<input
				bind:value={category}
				class="w-full border-0 border-b border-outline bg-transparent px-0 py-4 font-label text-sm uppercase tracking-[0.16rem] outline-none"
				placeholder="Category"
			/>
		</div>

		<div class="mt-8 flex flex-wrap items-center gap-4">
			<button class="primary-button" onclick={submit} disabled={pending || !url.trim()}>
				{pending ? 'Indexing Feed' : 'Add to Archive'}
			</button>
			{#if !canEdit}
				<p class="font-body text-base italic text-on-surface-variant">
					Sign in with Google to save feeds to your library.
				</p>
			{/if}
		</div>

		{#if errorMessage}
			<p class="mt-4 font-label text-xs uppercase tracking-[0.18rem] text-error">{errorMessage}</p>
		{/if}
	</div>
</div>
