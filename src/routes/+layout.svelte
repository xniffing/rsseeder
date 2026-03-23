<script lang="ts">
	import { page } from '$app/state';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import type { LayoutData } from './$types';
	import '@unocss/reset/tailwind.css';
	import 'katex/dist/katex.min.css';
	import 'virtual:uno.css';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,200..800&family=Space+Grotesk:wght@300;400;500;700&display=swap"
		rel="stylesheet"
	/>
	<title>ARCHIVE</title>
</svelte:head>

<div class="min-h-screen bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-white">
	{#if page.url.pathname !== '/login'}
		<AppHeader
			pathname={page.url.pathname}
			user={data.user}
			googleEnabled={data.googleEnabled}
			compact={page.url.pathname.startsWith('/entry/')}
		/>
	{/if}

	<div class={page.url.pathname !== '/login' && !page.url.pathname.startsWith('/entry/') ? 'pb-24' : ''}>
		{@render children()}
	</div>

	{#if page.url.pathname !== '/login' && !page.url.pathname.startsWith('/entry/')}
		<BottomNav pathname={page.url.pathname} />
	{/if}
</div>
