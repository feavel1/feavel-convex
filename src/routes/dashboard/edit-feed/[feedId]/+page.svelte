<script lang="ts">
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { api } from '$convex/_generated/api.js';
  import Editor from "$lib/components/feed-editor/Editor.svelte";
  import type { Id } from "$convex/_generated/dataModel";
  import { page } from '$app/stores';

  // Define feed type
  interface Feed {
    _id: Id<"feed">;
    title: string;
    content: any;
    slug: string;
    type: string;
    public: boolean;
    createdBy: string;
    createdAt: number;
    updatedAt?: number;
  }

  // Get the feedId from the route parameters
  let feedId = $state<Id<"feed"> | null>(null);

  // Update feedId when page parameters change
  $effect(() => {
    const unsubscribe = page.subscribe((page) => {
      const params = page.params;
      feedId = params.feedId as Id<"feed">;
    });
    return unsubscribe;
  });

  const convexClient = useConvexClient();

  // Create reactive query to fetch the feed data
  let feedQuery = $derived(
    feedId
      ? useQuery(api.feeds.feeds.getFeedById, () => ({ feedId: feedId! }))
      : { data: null, isLoading: false, error: null }
  );

  // Initialize state based on query result
  let feed = $state<Feed | null>(null);
  let content = $state<any>(null);
  let saving = $state<boolean>(false);
  let saveError = $state<string | null>(null);
  let loading = $state<boolean>(true);

  // Update state when query data becomes available
  $effect(() => {
    if (!feedId) {
      saveError = 'Feed ID not found in URL';
      loading = false;
      return;
    }

    // Set loading state based on the query status
    if (feedQuery.isLoading) {
      loading = true;
    } else if (feedQuery.error) {
      saveError = feedQuery.error.message || 'Error loading feed';
      loading = false;
    } else if (feedQuery.data) {
      feed = feedQuery.data as Feed;
      content = feedQuery.data.content;
      loading = false;
    }
  });

  // Debounce timer for auto-saving
  let saveTimeout: NodeJS.Timeout | null = $state(null);

  // Handle content changes from the editor
  async function handleContentChange(newContent: any) {
    if (!feed || !feed._id) return; // Wait for feed to load before allowing changes

    content = newContent;

    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Capture the feedId to ensure it doesn't become null later
    const currentFeedId = feed._id;

    // Set a new timeout to save after 2 seconds of inactivity
    saveTimeout = setTimeout(async () => {
      try {
        saving = true;
        saveError = null;

        await convexClient.mutation(api.feeds.feeds.updateFeed, {
          feedId: currentFeedId,
          content: newContent
        });
      } catch (err: unknown) {
        const error = err as Error;
        saveError = error.message;
        console.error('Save failed:', err);
      } finally {
        saving = false;
      }
    }, 2000); // 2 second debounce
  }

  // Handle title changes
  async function handleTitleChange() {
    if (!feed || !feed._id) return; // Wait for feed to load before allowing changes

    try {
      saving = true;
      saveError = null;

      await convexClient.mutation(api.feeds.feeds.updateFeed, {
        feedId: feed._id,
        title: feed.title
      });
    } catch (err: unknown) {
      const error = err as Error;
      saveError = error.message;
      console.error('Title update failed:', err);
    } finally {
      saving = false;
    }
  }
</script>

<div class="container mx-auto py-8">
  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  {:else if !feed}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <strong class="font-bold">Error! </strong>
      <span class="block sm:inline">{saveError || 'Feed not found'}</span>
    </div>
  {:else}
    <div class="mb-6">
      <input
        type="text"
        bind:value={feed.title}
        onblur={handleTitleChange}
        class="w-full text-2xl font-bold border-b border-gray-300 focus:outline-none focus:border-blue-500 p-2"
        placeholder="Feed title"
      />
    </div>

    {#if saveError}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Save Error! </strong>
        <span class="block sm:inline">{saveError}</span>
      </div>
    {/if}

    <div class="flex items-center mb-4">
      <span class="text-sm text-gray-500 mr-4">Status: {saving ? 'Saving...' : 'Saved'}</span>
      {#if saving}
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      {/if}
    </div>

    <Editor
      {content}
      feedId={feed._id}
      onChange={handleContentChange}
    />
  {/if}
</div>
