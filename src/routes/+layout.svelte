<script lang="ts">
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';

	//Styles
	import './layout.css';

	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner';

	//Auth
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';

	import { authClient } from '$lib/auth-client';
	import FloatingNavbar from '$lib/components/ui/floating-navbar/FloatingNavbar.svelte';
    import { ModeWatcher } from 'mode-watcher';

	createSvelteAuthClient({ authClient });

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<Toaster />
<FloatingNavbar />
<!-- <div class="container mx-auto py-8 max-w-6xl pt-6"> -->
{@render children?.()}
<!-- </div> -->

<!-- <LiquidGlass>ABC</LiquidGlass> -->
<div style="display:none">
	{#each locales as locale}
		<a
			href={localizeHref(page.url.pathname, { locale })}
		>
			{locale}
		</a>
	{/each}
</div>
