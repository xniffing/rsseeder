<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const now = new Date();
	const dateLabel = `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
	const yearLabel = `${now.getFullYear()} // ARCHIVE`;

	function publishedLabel(publishedAt: string) {
		return new Date(publishedAt).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<main class="mx-auto max-w-7xl px-6 pb-24 pt-10 md:px-10 md:pt-14">
	<section class="grid gap-10 md:grid-cols-12">
		<div class="md:col-span-8">
			<div class="editorial-kicker mb-5 flex items-center gap-3">
				<div class="h-px w-8 bg-primary-fixed"></div>
				Collected Dispatch
			</div>
			<h1 class="page-title">
				LATEST BRIEFING <span class="text-primary-fixed">.</span>
			</h1>
			<p class="mt-6 max-w-3xl font-body text-2xl leading-relaxed text-on-surface-variant">
				The latest stories from across your archive, distilled into a clear daily briefing.
			</p>
		</div>
		<div class="md:col-span-4 md:text-right">
			<div class="font-label text-4xl font-light text-outline">{dateLabel}</div>
			<div class="font-label text-[10px] uppercase tracking-[0.22rem] text-secondary">
				{yearLabel}
			</div>
			{#if !data.user}
				<p class="mt-6 max-w-xs font-body text-lg italic text-on-surface-variant md:ml-auto">
					<a href="/login" class="text-primary-fixed underline">Sign in</a> to generate a live digest from your subscribed sources.
				</p>
			{/if}
		</div>
	</section>

	{#if data.digest}
		<section class="mt-16 grid gap-8 border-y border-outline-variant/40 py-8 md:grid-cols-12 md:items-start">
			<div class="md:col-span-8">
				<div class="editorial-kicker mb-4">Overview</div>
				<p class="max-w-4xl font-body text-3xl leading-relaxed text-on-surface">
					{data.digest.overview}
				</p>
			</div>
			<div class="md:col-span-4 md:pl-8">
				<div class="editorial-kicker mb-4">Digest Signals</div>
				<div class="space-y-3">
					{#each data.digest.signals as signal}
						<div class="border-b border-outline-variant/30 pb-3 font-label text-xs uppercase tracking-[0.18rem] text-on-surface-variant">
							{signal}
						</div>
					{/each}
				</div>
				<div class="mt-8 font-label text-[10px] uppercase tracking-[0.22rem] text-secondary">
					{data.digest.sourceCount} sources • {data.digest.entryCount} entries • {data.digest.generatedAt
						? `Generated ${publishedLabel(data.digest.generatedAt)}`
						: 'Precomputed digest'}
				</div>
			</div>
		</section>

		<section class="mt-14 space-y-18">
			{#each data.digest.groups as group, index}
				<article class="grid gap-8 border-b border-outline-variant/35 pb-12 md:grid-cols-12">
					<div class="md:col-span-4">
						<div class="flex flex-wrap items-center gap-3">
							<div class="editorial-kicker">{String(index + 1).padStart(2, '0')} — {group.category}</div>
							<div class="bg-surface-container px-3 py-1 font-label text-[10px] uppercase tracking-[0.18rem] text-on-surface-variant">
								{group.type}
							</div>
						</div>
						<h2 class="mt-5 font-headline text-4xl font-bold leading-tight tracking-[-0.06em] md:text-5xl">
							{group.headline}
						</h2>
						<div class="mt-5 font-label text-xs uppercase tracking-[0.18rem] text-secondary">
							{group.articleCount} articles • {group.sourceCount} sources
						</div>
					</div>

					<div class="md:col-span-8">
						<p class="max-w-4xl font-body text-2xl leading-relaxed text-on-surface-variant">
							{group.summary}
						</p>

						<div class="mt-8 space-y-4">
							{#each group.articles as article}
								<div class="grid gap-4 border-t border-outline-variant/25 pt-4 md:grid-cols-[1fr_auto] md:items-start">
									<div>
										<div class="font-label text-[10px] uppercase tracking-[0.18rem] text-secondary">
											{article.feedTitle} • {publishedLabel(article.publishedAt)}
										</div>
										<a
											href={`/entry/${article.entryId}`}
											class="mt-2 block font-headline text-2xl font-bold leading-tight tracking-[-0.04em] transition-colors hover:text-primary-fixed"
										>
											{article.title}
										</a>
										{#if article.whyIncluded}
											<p class="mt-2 font-body text-lg italic leading-relaxed text-on-surface-variant">
												{article.whyIncluded}
											</p>
										{/if}
									</div>
									<a href={article.url} target="_blank" rel="noreferrer" class="secondary-button self-start px-4 py-2">
										Source
									</a>
								</div>
							{/each}
						</div>
					</div>
				</article>
			{/each}
		</section>
	{:else if data.user && !data.feeds.length}
		<section class="mt-16 surface-panel p-10 md:p-12">
			<div class="editorial-kicker mb-4">No Sources Yet</div>
			<h2 class="font-headline text-4xl font-bold tracking-[-0.05em]">Build the archive first.</h2>
			<p class="mt-5 max-w-2xl font-body text-2xl leading-relaxed text-on-surface-variant">
				Add a few sources and the hourly cron will compile them into a grouped homepage digest.
			</p>
			<a href="/discover" class="primary-button mt-8">Add New Source</a>
		</section>
	{:else}
		<section class="mt-16 surface-panel p-10 md:p-12">
			<div class="editorial-kicker mb-4">Digest Pending</div>
			<h2 class="font-headline text-4xl font-bold tracking-[-0.05em]">The next briefing is still being composed.</h2>
			<p class="mt-5 max-w-3xl font-body text-2xl leading-relaxed text-on-surface-variant">
				Your raw entries are available below while the next precomputed digest is prepared by the hourly sync.
			</p>
		</section>

		{#if data.fallbackEntries.length}
			<section class="mt-10 grid gap-5 md:grid-cols-12">
				<div class="md:col-span-4">
					<div class="editorial-kicker">Incoming Material</div>
				</div>
				<div class="md:col-span-8 space-y-4">
					{#each data.fallbackEntries as entry}
						<div class="border-b border-outline-variant/25 pb-4">
							<div class="font-label text-[10px] uppercase tracking-[0.18rem] text-secondary">
								{entry.feedTitle} • {publishedLabel(entry.publishedAt)}
							</div>
							<a href={`/entry/${entry.id}`} class="mt-2 block font-headline text-2xl font-bold tracking-[-0.04em] transition-colors hover:text-primary-fixed">
								{entry.title}
							</a>
							<p class="mt-2 font-body text-lg leading-relaxed text-on-surface-variant">
								{entry.summary}
							</p>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</main>
