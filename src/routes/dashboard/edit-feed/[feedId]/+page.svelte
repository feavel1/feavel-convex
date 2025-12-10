<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '$convex/_generated/api.js';
  import Editor from "$lib/components/feed-editor/Editor.svelte";
  import type { Id } from "$convex/_generated/dataModel";

  let { params } = $props();

  // Get feedId from URL params
  let feedId: Id<"feed"> = params.feedId as Id<"feed">;

  // Get the feed data for real-time editing
  let feedQuery = $derived(useQuery(api.feeds.feeds.getFeedById, () => ({ feedId })));
  let feed = $derived(feedQuery.data);

  const convexClient = useConvexClient();
  let saving = $state<boolean>(false);
  let saveError = $state<string | null>(null);
  let lastUpdateByOther = $state<string | null>(null);
  let lastSavedVersion = $state<number | null>(null); // Track the version of the last saved content

  // Track loading and error states
  let isLoading = $derived(feedQuery.isLoading);
  let error = $derived(feedQuery.error);

  // Debounce timer for auto-saving
  let saveTimeout: NodeJS.Timeout | null = $state(null);

  // Unified update function that handles all field changes
  function queueUpdate(field: string, value: any) {
    if (!feed) return;

    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set a new timeout to save after 2 seconds of inactivity
    saveTimeout = setTimeout(async () => {
      try {
        saving = true;
        saveError = null;

        // Single API call with the specific field update
        const updateData: any = {
          feedId: feed!._id,
        };
        updateData[field] = value;

        await convexClient.mutation(api.feeds.feeds.updateFeed, updateData);

        // Update the last saved version after successful save
        if (field === 'content') {
          lastSavedVersion = Date.now(); // Use timestamp as a simple version marker
        }
      } catch (err: unknown) {
        const error = err as Error;
        saveError = error.message;
        console.error('Update failed:', err);
      } finally {
        saving = false;
      }
    }, 3000); // 2 second debounce
  }

  // Handle content changes from the editor
  function handleContentChange(newContent: any) {
    if (!feed) return;
    queueUpdate('content', newContent);
  }

  // Handle title changes
  function handleTitleChange() {
    if (!feed) return;
    queueUpdate('title', feed.title);
  }

  // // Track when feed data changes from other users
  // $effect(() => {
  //   if (feed && feed.updatedAt) {
  //     // Check if this update is more recent than our last saved version
  //     if (lastSavedVersion && feed.updatedAt > lastSavedVersion && saving === false) {
  //       // This indicates the content was updated by another user
  //       lastUpdateByOther = `Content updated by another user at ${new Date(feed.updatedAt).toLocaleTimeString()}`;
  //       setTimeout(() => {
  //         lastUpdateByOther = null; // Clear the notification after a few seconds
  //       }, 5000);
  //     }
  //   }
  // });
</script>

<div class="container mx-auto py-8">
  {#if isLoading}
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p class="mt-2">Loading...</p>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <strong class="font-bold">Error! </strong>
      <span class="block sm:inline">{error.message}</span>
    </div>
  {:else if feed}
    {#if lastUpdateByOther}
      <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <span><strong>Updated!</strong> {lastUpdateByOther}</span>
      </div>
    {/if}

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
      content={feed.content}
      feedId={feed._id!}
      onChange={handleContentChange}
    />
  {:else}
    <div class="text-center py-8">
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Error! </strong>
        <span class="block sm:inline">Unable to access feed</span>
      </div>
    </div>
  {/if}
</div>
