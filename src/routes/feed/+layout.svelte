<script lang="ts">
	import { setContext } from 'svelte';

	// Shared feed state across feed pages in this layout
	let activeTab = $state('article');
	let currentPage = $state(1);
	let cursorMap = $state(new Map<number, string | null>());

	const { children } = $props();

	setContext('feed:state', {
		activeTab: {
			get: () => activeTab,
			set: (v: string) => (activeTab = v)
		},
		currentPage: {
			get: () => currentPage,
			set: (v: number) => (currentPage = v)
		},
		cursorMap: {
			get: () => cursorMap,
			set: (v: Map<number, string | null>) => (cursorMap = v)
		}
	});
</script>

<div class="p-6 md:p-10">
	{@render children()}
</div>
