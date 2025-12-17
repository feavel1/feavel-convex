<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { useConvexClient } from 'convex-svelte';
	import Heart from '@lucide/svelte/icons/heart';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Id } from '$convex/_generated/dataModel';

	// Define props - now include like data directly
	let {
		feedId,
		likeCount: initialLikeCount,
		isLiked: initialIsLiked
	} = $props<{
		feedId: Id<'feed'>;
		likeCount: number;
		isLiked: boolean;
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

<Button
	variant={isLiked ? 'default' : 'outline'}
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
