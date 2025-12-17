<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '$convex/_generated/api.js';
  import Editor from "$lib/components/feed-editor/Editor.svelte";
  import type { Id, Doc } from "$convex/_generated/dataModel";

  // Feed editor components
  import FeedSettingsCard from "$lib/components/feed-editor/FeedSettingsCard.svelte";
  import CoverImageManager from "$lib/components/feed-editor/CoverImageManager.svelte";
  import CollaboratorManager from "$lib/components/feed-editor/CollaboratorManager.svelte";
  import FeedTitleEditor from "$lib/components/feed-editor/FeedTitleEditor.svelte";

  let { params } = $props();

  // Get feedId from URL params reactively
  let feedId: Id<"feed"> = $derived(params.feedId as Id<"feed">);

  // Get the feed data
  let feedQuery = useQuery(api.feeds.feeds.unifiedFeedQuery, () => ({ feedIds: [feedId] }));
  let feed = $derived(feedQuery.data?.feeds?.[0]);

  const convexClient = useConvexClient();
  let saving = $state<boolean>(false);
  let saveError = $state<string | null>(null);

  // Track loading and error states
  let isLoading = $derived(feedQuery.isLoading);
  let error = $derived(feedQuery.error);

  // Debounce timer for auto-saving
  let saveTimeout: NodeJS.Timeout | null = $state(null);

  // Track if we're currently saving to prevent triggering additional saves during save operation
  let isCurrentlySaving = $state(false);

  // Function to save the feed with debouncing
  function debouncedSave() {
    if (!feed || isCurrentlySaving) return;

    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set a new timeout to save after 8 seconds of inactivity
    saveTimeout = setTimeout(async () => {
      try {
        isCurrentlySaving = true;
        saving = true;
        saveError = null;

        const updateData = {
          feedId: feed._id,
          title: feed.title,
          type: feed.type,
          language: feed.language,
          public: feed.public,
          meta: feed.meta,
          coverFileId: feed.coverFileId,
          content: feed.content
        };

        await convexClient.mutation(api.feeds.feeds.updateFeed, updateData);
      } catch (err: unknown) {
        const error = err as Error;
        saveError = error.message;
        console.error('Update failed:', err);
      } finally {
        isCurrentlySaving = false;
        saving = false;
      }
    }, 8000); // 8 second debounce
  }

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

    <FeedSettingsCard
      {feed}
      {debouncedSave}
    />

    <CoverImageManager
      {feed}
      {debouncedSave}
    />

    <CollaboratorManager
      {feed}
    />

    <FeedTitleEditor
      {feed}
      {debouncedSave}
    />

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
      onChange={(newContent: any) => {
        if (feed) {
          feed.content = newContent;
          debouncedSave();
        }
      }}
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
