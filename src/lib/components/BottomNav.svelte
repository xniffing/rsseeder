<script lang="ts">
	import { Bookmark, Grid2x2, Newspaper, PlusCircle } from 'lucide-svelte';

	let { pathname }: { pathname: string } = $props();

	const navItems = [
		{ href: '/library', label: 'Library', icon: Grid2x2 },
		{ href: '/feed', label: 'Feed', icon: Newspaper },
		{ href: '/discover', label: 'Discover', icon: PlusCircle },
		{ href: '/saved', label: 'Saved', icon: Bookmark }
	];

	function isActive(href: string) {
		return pathname.startsWith(href);
	}
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/50 bg-background md:hidden" style="padding-bottom: env(safe-area-inset-bottom);">
	<div class="grid grid-cols-4 px-4 py-3">
		{#each navItems as item}
			{@const Icon = item.icon}
			<a
				href={item.href}
				class={`flex flex-col items-center gap-1 py-1 text-center ${
					isActive(item.href) ? 'text-primary-fixed' : 'text-secondary'
				}`}
			>
				<Icon size={18} strokeWidth={1.75} />
				<span class="font-label text-[10px] font-bold uppercase tracking-[0.18rem]">
					{item.label}
				</span>
			</a>
		{/each}
	</div>
</nav>
