<!-- <script>
    import Separator from "$lib/components/ui/separator/separator.svelte";
    import * as Tabs from '$lib/components/ui/tabs/index.js';

    // Define the feed type tabs
    const feedTypeTabs = [
      { value: 'article', label: 'Articles', description: 'View public article feeds' },
      { value: 'product', label: 'Products', description: 'View public product feeds' },
      { value: 'service', label: 'Services', description: 'View public service feeds' },
    ];

    // Reactive state for the active tab
    let activeTab = $state('article');


    let { children } = $props();

</script>
<div class="flex flex-1 flex-col">
	<div class="flex-1 space-y-6 p-6 md:p-10">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
			<p class="text-muted-foreground">Some basic info on what is going on</p>
		</div>

		<Separator />

	</div>
</div> -->

<script>
	let { children } = $props();
</script>

<div class="fixed flex flex-row gap-6">
	<a href="/dashboard/edit-feed">Edit-feed</a>
	<a href="/dashboard/settings">Settings</a>
	<a href="/dashboard/admin/users">Admin</a>
</div>

{@render children?.()}
