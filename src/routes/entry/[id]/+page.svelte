<script lang="ts">
	import BookmarkButton from '$lib/components/BookmarkButton.svelte';
	import { markdownToHtml } from '$lib/markdown';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

{#if data.entry}
	{@const entry = data.entry}
	{@const renderedBody = markdownToHtml(
		entry.contentMarkdown || entry.contentText || entry.summary,
		entry.url
	)}
	{@const publishedLabel = new Date(entry.publishedAt).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})}

	<div class="reading-progress" style="width: 36%;"></div>

	<main class="mx-auto grid max-w-[1440px] grid-cols-12 gap-8 px-6 pb-28 pt-10 md:px-16">
		<aside class="col-span-12 hidden lg:col-span-2 lg:block">
			<div class="sticky top-28 space-y-10">
				<div>
					<div class="editorial-kicker mb-2">Archived From</div>
					<div class="font-headline text-2xl font-bold leading-tight text-primary-fixed">
						{entry.feedTitle}
					</div>
				</div>
				<div>
					<div class="editorial-kicker mb-2">Dated</div>
					<div class="font-headline text-base">{publishedLabel}</div>
				</div>
				<div>
					<div class="editorial-kicker mb-2">Extent</div>
					<div class="font-headline text-base">{entry.readingMinutes} min read</div>
				</div>
			</div>
		</aside>

		<article class="col-span-12 lg:col-span-8 lg:col-start-4">
			<header class="mb-14">
				<div class="editorial-kicker mb-5">{entry.feedTitle}</div>
				<h1 class="font-headline text-5xl font-bold leading-[0.92] tracking-[-0.08em] md:text-7xl lg:text-8xl">
					{entry.title}
				</h1>
				<div class="mt-8 h-px w-24 bg-primary-fixed"></div>
			</header>

			<div class="mb-14 grid gap-6 border-y border-outline-variant/40 py-6 md:flex md:items-center md:justify-between">
				<div class="flex flex-wrap gap-4 font-label text-xs uppercase tracking-[0.18rem] text-secondary">
					<span>{publishedLabel}</span>
					<span>{entry.readingMinutes} min read</span>
					{#if data.usingDemo}
						<span>Demo Archive</span>
					{/if}
				</div>
				<div class="flex flex-wrap gap-3">
					<BookmarkButton entryId={entry.id} bookmarked={entry.bookmarked} canEdit={Boolean(data.user)} />
					<a href={entry.url} class="secondary-button" target="_blank" rel="noreferrer">Source</a>
				</div>
			</div>

			<section
				class="reading-markdown prose prose-slate max-w-none prose-headings:font-headline prose-headings:tracking-[-0.05em] prose-p:font-body prose-p:text-2xl prose-p:leading-relaxed prose-p:text-on-surface/95 prose-a:text-primary-fixed prose-strong:text-on-surface prose-code:font-mono prose-pre:border prose-pre:border-outline-variant prose-pre:bg-surface-container prose-blockquote:border-primary-fixed prose-blockquote:text-on-surface-variant"
			>
				{@html renderedBody}
			</section>
		</article>
	</main>
{/if}
