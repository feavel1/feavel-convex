<script lang="ts">
  import { api } from '$convex/_generated/api.js';
  import { useQuery } from 'convex-svelte';
  import { useConvexClient } from 'convex-svelte';
  import Heart from '@lucide/svelte/icons/heart';
  import { Button } from '$lib/components/ui/button/index.js';
  import type { Id } from '$convex/_generated/dataModel';

  // Define props
  let { feedId } = $props<{ feedId: Id<'feed'> }>();

  // Get Convex client for mutations
  const client = useConvexClient();

  // Query for like data (status and count)
  const likeDataQuery = useQuery(api.feeds.likes.getLikeData, () => ({ feedId }));

  // Reactive state
  let isSubmitting = $derived(likeDataQuery.isLoading);

  // Handle toggle like
  const handleToggleLike = async () => {
    if (likeDataQuery.isLoading) return;

    const currentData = likeDataQuery.data;
    if (!currentData) return;

    // Optimistic update
    const newIsLiked = !currentData.isLiked;

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
      // The query will automatically revert the optimistic update
    }
  };
</script>

<Button
  variant={likeDataQuery.data?.isLiked ? 'default' : 'outline'}
  onclick={handleToggleLike}
  disabled={isSubmitting || !likeDataQuery.data}
  class="gap-2"
>
  {#if isSubmitting}
    <div
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    ></div>
  {:else}
    <Heart class="h-4 w-4 {likeDataQuery.data?.isLiked ? 'fill-red-500 text-red-500' : ''}" />
  {/if}
  {likeDataQuery.data?.likeCount ?? 0}
</Button>
