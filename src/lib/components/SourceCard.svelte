<script lang="ts">
	import type { ArchiveFeed } from '$lib/types';
	import SyncButton from './SyncButton.svelte';

	let {
		feed,
		canSync = false,
		featured = false
	}: {
		feed: ArchiveFeed;
		canSync?: boolean;
		featured?: boolean;
	} = $props();
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
				</div>
			</div>
		</div>
</article>
