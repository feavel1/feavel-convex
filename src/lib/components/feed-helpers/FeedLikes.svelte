<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { useConvexClient } from 'convex-svelte';
	import Heart from '@lucide/svelte/icons/heart';
	import { toast } from 'svelte-sonner';
	import type { Id } from '$convex/_generated/dataModel';

	// Define props - now include like data directly
	let {
		feedId,
		likeCount: initialLikeCount,
		isLiked: initialIsLiked,
		user
	} = $props<{
		feedId: Id<'feed'>;
		likeCount: number;
		isLiked: boolean;
		user: any; // User type will be passed from parent component
	}>();

	// State with initial values from props
	let likeCount = $derived(initialLikeCount);
	let isLiked = $derived(initialIsLiked);
	let isSubmitting = $state(false);

	// Get Convex client for mutations
	const client = useConvexClient();

	// Handle toggle like
	const handleToggleLike = async () => {
		if (isSubmitting) return;

		// Check if user is authenticated
		if (!user) {
			toast.error('Please log in to like this feed');
			return;
		}

		// Optimistic update
		const newIsLiked = !isLiked;
		const likeDelta = newIsLiked ? 1 : -1;
		isLiked = newIsLiked;
		likeCount = likeCount + likeDelta;
		isSubmitting = true;

		try {
			if (newIsLiked) {
				// Add like
				await client.mutation(api.feeds.likes.addLike, { feedId });
			} else {
				// Remove like
				await client.mutation(api.feeds.likes.removeLike, { feedId });
			}
		} catch (error) {
			console.error('Error toggling like:', error);
			// Revert optimistic update on error
			isLiked = !newIsLiked;
			likeCount = likeCount - likeDelta;
		} finally {
			isSubmitting = false;
		}
	};
</script>

<button
	type="button"
	class="flex items-center gap-1 cursor-pointer hover:opacity-80 {isSubmitting ? 'opacity-50' : ''}"
	onclick={handleToggleLike}
>
	{#if isSubmitting}
		<div
			class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
		></div>
	{:else}
		<Heart class="h-4 w-4 {isLiked ? 'fill-red-500' : ''}" />
	{/if}
	<span class="text-sm">{likeCount}</span>
</button>
