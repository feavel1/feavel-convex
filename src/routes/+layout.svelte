<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
  import { authClient } from '$lib/auth-client';
  import { Toaster } from '$lib/components/ui/sonner';
  createSvelteAuthClient({ authClient });
  let { children } = $props();
</script>

<Toaster />
<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="container mx-auto py-8 max-w-6xl">
 {@render children?.()}
</div>
