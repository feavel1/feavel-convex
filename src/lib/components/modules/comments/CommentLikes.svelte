<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { useConvexClient } from 'convex-svelte';
	import Heart from '@lucide/svelte/icons/heart';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';
	import type { Id } from '$convex/_generated/dataModel';

	// Define props - include like data directly
	let {
		commentId,
		likeCount: initialLikeCount,
		isLiked: initialIsLiked,
		user
	} = $props<{
		commentId: Id<'feedComments'>;
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
			toast.error('Please log in to like this comment');
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
				await client.mutation(api.feeds.comments.addCommentLike, { commentId });
			} else {
				// Remove like
				await client.mutation(api.feeds.comments.removeCommentLike, { commentId });
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

<Button
	size="sm"
	variant={isLiked ? 'default' : 'ghost'}
	onclick={handleToggleLike}
	disabled={isSubmitting}
	class="gap-2"
>
	{#if isSubmitting}
		<div
			class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
		></div>
	{:else}
		<Heart class="h-4 w-4 {isLiked ? 'fill-red-500 text-red-500' : ''}" />
	{/if}
	{likeCount}
</Button>