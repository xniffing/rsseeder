<script lang="ts">
	import type { ArchiveUser } from '$lib/types';
	import { ArrowLeft, Search } from 'lucide-svelte';

	let {
		pathname,
		user = null,
		googleEnabled = false,
		compact = false
	}: {
		pathname: string;
		user: ArchiveUser | null;
		googleEnabled: boolean;
		compact?: boolean;
	} = $props();

	const navItems = [
		{ href: '/', label: 'Latest' },
		{ href: '/feed', label: 'Feed' },
		{ href: '/library', label: 'Library' },
		{ href: '/discover', label: 'Discover' },
		{ href: '/saved', label: 'Saved' }
	];

	function isActive(href: string) {
		return href === '/' ? pathname === '/' : pathname.startsWith(href);
	}
	
</script>

<header class="sticky top-0 z-50 border-b border-outline-variant/40 bg-background/95 backdrop-blur">
	<div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 md:px-10">
		<div class="flex items-center gap-4">
			{#if compact}
				<a href="/feed" class="icon-button" aria-label="Back to feed">
					<ArrowLeft size={18} strokeWidth={1.75} />
				</a>
			{/if}
			<a href="/" class="font-headline text-xl font-bold tracking-[-0.08em] uppercase">
				ARCHIVE
			</a>
		</div>

		{#if !compact}
			<nav class="hidden items-center gap-6 md:flex">
				{#each navItems as item}
					<a
						href={item.href}
						class={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
					>
						{item.label}
					</a>
				{/each}
			</nav>
		{/if}

		<div class="flex items-center gap-3">
			<a href="/discover" class="icon-button hidden md:grid" aria-label="Discover feeds">
				<Search size={18} strokeWidth={1.75} />
			</a>

			{#if user}
				<div class="hidden items-center gap-3 md:flex">
					{#if user.avatar}
						<img
							src={user.avatar}
							alt={`${user.name} profile photo`}
							class="h-11 w-11 rounded-full border border-outline-variant object-cover"
							referrerpolicy="no-referrer"
						/>
					{:else}
						<div class="grid h-11 w-11 place-items-center border border-outline-variant bg-surface-container font-label text-xs font-bold uppercase">
							{user.name.slice(0, 1)}
						</div>
					{/if}
					<div class="text-right">
						<div class="font-label text-10px uppercase tracking-[0.2rem] text-secondary">Signed In</div>
						<div class="font-headline text-sm font-bold">{user.name}</div>
					</div>
				</div>
				<a href="/auth/logout" class="secondary-button hidden md:inline-flex">Logout</a>
			{:else if googleEnabled}
				<a href="/login" class="primary-button hidden md:inline-flex">Sign In</a>
			{:else}
				<div class="hidden text-right md:block">
					<div class="font-label text-10px uppercase tracking-[0.2rem] text-secondary">Auth</div>
					<div class="font-body text-sm italic text-on-surface-variant">Configure Google to unlock sync</div>
				</div>
			{/if}
		</div>
	</div>
</header>
