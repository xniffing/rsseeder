<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';

	let {
		entryId,
		bookmarked = false,
		canEdit = false
	}: {
		entryId: string;
		bookmarked?: boolean;
		canEdit?: boolean;
	} = $props();

	let pending = $state(false);
	let saved = $state(false);

	$effect(() => {
		saved = bookmarked;
	});

	async function toggleBookmark() {
		if (!canEdit) {
			await goto('/login');
			return;
		}

		pending = true;

		try {
			const response = await fetch(saved ? `/api/bookmarks/${entryId}` : '/api/bookmarks', {
				method: saved ? 'DELETE' : 'POST',
				headers: saved ? undefined : { 'content-type': 'application/json' },
				body: saved ? undefined : JSON.stringify({ entryId })
			});

			if (!response.ok) {
				throw new Error('Bookmark request failed');
			}

			saved = !saved;
			await invalidateAll();
		} finally {
			pending = false;
		}
	}
</script>

<button class="secondary-button px-4 py-2 disabled:opacity-60" onclick={toggleBookmark} disabled={pending}>
	{#if saved}
		Saved
	{:else}
		Save
	{/if}
</button>
