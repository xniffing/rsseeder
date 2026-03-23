<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { ArchiveFeed } from '$lib/types';
	import SyncButton from './SyncButton.svelte';

	let {
		feed,
		canSync = false,
		canDelete = false,
		featured = false
	}: {
		feed: ArchiveFeed;
		canSync?: boolean;
		canDelete?: boolean;
		featured?: boolean;
	} = $props();

	let deleting = $state(false);
	let deletionError = $state('');

	async function deleteSource() {
		if (!canDelete || deleting) return;
		if (!confirm(`Remove ${feed.title}? This will delete its entries from the archive.`)) {
			return;
		}

		deletionError = '';
		deleting = true;

		try {
			const response = await fetch(`/api/feeds/${feed.id}`, { method: 'DELETE' });
			if (!response.ok) {
				const payload =
					(await response.json().catch(() =>
						({ error: 'Unable to delete feed' } as { error?: string })
					)) as { error?: string };
				throw new Error(payload.error ?? 'Unable to delete feed');
			}

			await invalidateAll();
		} catch (error: unknown) {
			deletionError = error instanceof Error ? error.message : 'Unable to delete feed';
		} finally {
			deleting = false;
		}
	}
</script>

<article class={`surface-panel ${featured ? 'p-0' : 'p-6'}`}>
		<div class={`grid ${featured ? 'md:grid-cols-[1.3fr_1fr]' : 'gap-5'}`}>
			<div class={featured ? 'min-h-72 bg-surface-container-high' : 'hidden'}></div>
			<div class="p-6 md:p-8">
				<div class="flex items-center justify-between gap-4">
					<div class="editorial-kicker">{feed.category}</div>
					<div class="font-label text-[10px] uppercase tracking-[0.18rem] text-primary-fixed">
						{feed.unreadCount} unread
					</div>
				</div>
				<h3 class="mt-4 font-headline text-3xl font-bold tracking-[-0.05em]">{feed.title}</h3>
				<p class="mt-4 font-body text-xl leading-relaxed text-on-surface-variant">
					{feed.description || 'No description available.'}
				</p>
				<div class="mt-6 flex flex-wrap gap-6 font-label text-xs uppercase tracking-[0.16rem] text-secondary">
					<span>{feed.totalEntries} entries</span>
					<span>
						Synced
						{new Date(feed.lastSyncedAt).toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric'
						})}
					</span>
				</div>
				<div class="mt-8 flex flex-wrap gap-4">
					<a href={feed.siteUrl} class="secondary-button">Visit Source</a>
					<SyncButton feedId={feed.id} {canSync} />
					{#if canDelete}
						<button
							class="secondary-button border-error text-error"
							onclick={deleteSource}
							disabled={deleting}
						>
							{deleting ? 'Removing...' : 'Remove Source'}
						</button>
					{/if}
				</div>
				{#if deletionError}
					<p class="mt-3 text-xs font-label uppercase tracking-[0.18rem] text-error">
						{deletionError}
					</p>
				{/if}
			</div>
		</div>
</article>
