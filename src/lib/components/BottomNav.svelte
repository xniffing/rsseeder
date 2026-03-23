<script lang="ts">
	import { Bookmark, Clock, Grid2x2, Newspaper, PlusCircle } from 'lucide-svelte';

	let { pathname }: { pathname: string } = $props();

	const navItems = [
		{ href: '/feed', label: 'Feed', icon: Newspaper },
		{ href: '/', label: 'Latest', icon: Clock, exact: true },
		{ href: '/saved', label: 'Saved', icon: Bookmark },
		{ href: '/discover', label: 'Discover', icon: PlusCircle },
		{ href: '/library', label: 'Library', icon: Grid2x2 }
	];

	function isActive(href: string, exact = false) {
		return exact ? pathname === href : pathname.startsWith(href);
	}
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/50 bg-background md:hidden" style="padding-bottom: env(safe-area-inset-bottom);">
	<div class="grid grid-cols-5 py-2">
		{#each navItems as item}
			{@const Icon = item.icon}
			<a
				href={item.href}
				class={`flex flex-col items-center justify-center gap-1 py-2 ${
					isActive(item.href, item.exact) ? 'text-primary-fixed' : 'text-secondary'
				}`}
			>
				<Icon size={20} strokeWidth={1.75} />
				<span class="font-label text-[9px] font-bold uppercase tracking-[0.08rem]">
					{item.label}
				</span>
			</a>
		{/each}
	</div>
</nav>
