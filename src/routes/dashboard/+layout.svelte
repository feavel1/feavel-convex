<script>
	let { children } = $props();
</script>

<div class="absolute flex flex-row gap-6">
	<a href="/dashboard/edit-feed">Edit-feed</a>
	<a href="/dashboard/settings">Settings</a>
	<a href="/dashboard/admin/users">Admin</a>
</div>

{@render children?.()}
