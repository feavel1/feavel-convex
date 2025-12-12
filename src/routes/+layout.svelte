<script lang="ts">
  //Styles
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { Toaster } from '$lib/components/ui/sonner';
  import { Home, House, MessageCircle, User } from '@lucide/svelte';


  //Auth
  import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
  import { authClient } from '$lib/auth-client';
  import FloatingNavbar from '$lib/components/ui/floating-navbar/FloatingNavbar.svelte';

  createSvelteAuthClient({ authClient });

  let { children } = $props();

 	const navItems = [
		{
			name: 'Home',
			link: '/',
			icon: Home
		},
		{
			name: 'Feed',
			link: '/feed',
			icon: User
		},
		{
			name: 'About',
			link: '/about',
			icon: MessageCircle
		}
	];
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Toaster />
<FloatingNavbar {navItems} />

<div class="container mx-auto py-8 max-w-6xl mt-6">
 {@render children?.()}
</div>
