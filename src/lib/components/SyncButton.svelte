<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let {
		feedId,
		canSync = false
	}: {
		feedId: string;
		canSync?: boolean;
	} = $props();

	let pending = $state(false);

	async function syncFeed() {
		if (!canSync) return;

		pending = true;

		try {
			const response = await fetch(`/api/feeds/${feedId}/sync`, { method: 'POST' });
			if (!response.ok) throw new Error('Feed sync failed');
			await invalidateAll();
		} finally {
			pending = false;
		}
	}
</script>

<button class="secondary-button px-4 py-2" onclick={syncFeed} disabled={!canSync || pending}>
	{pending ? 'Syncing' : 'Sync'}
</button>
