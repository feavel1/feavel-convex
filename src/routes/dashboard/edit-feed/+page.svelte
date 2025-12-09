<script lang="ts">
  import { useConvexClient } from 'convex-svelte';
  import { api } from '$convex/_generated/api.js';
  import { goto } from '$app/navigation';
  import * as Empty from "$lib/components/ui/empty/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  const convexClient = useConvexClient();

  let creating = $state(false);
  let error = $state<string | null>(null);

  async function createNewFeed() {
    creating = true;
    error = null;

    try {
      // Create a new feed with default values
      const newFeedId = await convexClient.mutation(api.feeds.feeds.createFeed, {
        title: "Untitled Feed",
        content: {}, // Empty Editor.js content
        type: "article", // Default type
        public: false,   // Default to private
        meta: {} // Empty metadata
      });

      // Redirect to the newly created feed's edit page
      await goto(`/dashboard/edit-feed/${newFeedId}`);
    } catch (err: unknown) {
      const errorObj = err as Error;
      error = errorObj.message || 'Failed to create feed';
      console.error('Feed creation failed:', err);
      creating = false;
    }
  }
</script>

<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-12 h-12">
        <path d="M4 20h16"></path>
        <path d="M4 12h16"></path>
        <path d="M4 4h16"></path>
      </svg>
    </Empty.Media>
    <Empty.Title>Create your first feed</Empty.Title>
    <Empty.Description>Get started by creating a new feed. You can customize it after creation.</Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <div class="space-y-4">
      {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong class="font-bold">Error! </strong>
          <span class="block sm:inline">{error}</span>
        </div>
      {/if}

      <Button
        variant="default"
        class="w-full sm:w-auto"
        disabled={creating}
        onclick={createNewFeed}
      >
        {#if creating}
          <span class="flex items-center">
            <span class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            Creating...
          </span>
        {:else}
          + Create New Feed
        {/if}
      </Button>
    </div>
  </Empty.Content>
</Empty.Root>
