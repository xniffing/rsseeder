<script lang="ts">
	import type { ArchiveEntry } from '$lib/types';
	import BookmarkButton from './BookmarkButton.svelte';

	let {
		entry,
		canBookmark = false,
		featured = false
	}: {
		entry: ArchiveEntry;
		canBookmark?: boolean;
		featured?: boolean;
	} = $props();
</script>

{#if featured}
	<article class="surface-panel grid gap-10 p-8 md:grid-cols-12 md:p-10">
		<div class="md:col-span-7">
			<div class="mb-4 flex items-center gap-3">
				<div class="status-dot"></div>
				<span class="font-label text-[10px] font-bold uppercase tracking-[0.22rem] text-primary-fixed">
					Featured Entry
				</span>
			</div>
			<a href={`/entry/${entry.id}`} class="block">
				<h3 class="font-headline text-4xl font-bold leading-[1.02] tracking-[-0.06em] transition-colors hover:text-primary-fixed md:text-5xl">
					{entry.title}
				</h3>
			</a>
			<p class="mt-6 max-w-2xl font-body text-2xl leading-relaxed text-on-surface-variant">
				{entry.summary}
			</p>
			<div class="mt-8 flex flex-wrap gap-2">
				{#each entry.tags as tag}
					<span class="bg-surface-container-high px-3 py-1 font-label text-[10px] uppercase tracking-[0.18rem]">
						{tag}
					</span>
				{/each}
			</div>
		</div>
		<div class="flex flex-col justify-between border-t border-outline-variant/40 pt-6 md:col-span-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
			<div>
				<div class="editorial-kicker">{entry.feedTitle}</div>
				<div class="mt-2 font-label text-sm uppercase tracking-[0.14rem] text-on-surface-variant">
					{new Date(entry.publishedAt).toLocaleString('en-US', {
						month: 'short',
						day: 'numeric',
						hour: 'numeric',
						minute: '2-digit'
					})}
					• {entry.readingMinutes} min read
				</div>
			</div>
			<div class="mt-8 flex items-center justify-between gap-4">
				<a href={`/entry/${entry.id}`} class="primary-button">Open Reader</a>
				<BookmarkButton entryId={entry.id} bookmarked={entry.bookmarked} canEdit={canBookmark} />
			</div>
		</div>
	</article>
{:else}
	<article class="group grid gap-6 border-b border-outline-variant/40 py-10 md:grid-cols-12 md:gap-8">
		<div class="md:col-span-3">
			<div class="flex items-center gap-3">
				{#if entry.status === 'unread'}
					<div class="status-dot"></div>
					<span class="font-label text-[10px] font-bold uppercase tracking-[0.22rem] text-primary-fixed">
						Unread
					</span>
				{/if}
			</div>
			<div class="mt-3 font-label text-xs uppercase tracking-[0.18rem] text-secondary">{entry.feedTitle}</div>
			<div class="mt-1 font-label text-sm text-on-surface-variant">
				{new Date(entry.publishedAt).toLocaleString('en-US', {
					month: 'short',
					day: 'numeric',
					hour: 'numeric',
					minute: '2-digit'
				})}
			</div>
		</div>
		<div class="md:col-span-7">
			<a href={`/entry/${entry.id}`} class="block">
				<h3 class="font-headline text-3xl font-bold leading-tight tracking-[-0.05em] transition-colors group-hover:text-primary-fixed">
					{entry.title}
				</h3>
			</a>
			<p class="mt-4 font-body text-xl leading-relaxed text-on-surface-variant">{entry.summary}</p>
			<div class="mt-5 flex flex-wrap gap-2">
				{#each entry.tags as tag}
					<span class="bg-surface-container px-3 py-1 font-label text-[10px] uppercase tracking-[0.18rem]">
						{tag}
					</span>
				{/each}
			</div>
		</div>
		<div class="flex items-start justify-between gap-4 md:col-span-2 md:justify-end">
			<div class="font-label text-xs uppercase tracking-[0.18rem] text-secondary">
				{entry.readingMinutes} min
			</div>
			<BookmarkButton entryId={entry.id} bookmarked={entry.bookmarked} canEdit={canBookmark} />
		</div>
	</article>
{/if}
