<script lang="ts">
  import type { PageData } from './$types';
  import { useConvexClient } from 'convex-svelte';
  import { api } from '$convex/_generated/api.js';
  import Editor from "$lib/components/feed-editor/Editor.svelte";
  import type { Id } from "$convex/_generated/dataModel";

  // Get data from server-side load (no authentication needed client-side)
  let { data } = $props<{ data: PageData }>();

  // Unified feed state - populated from server-side data
  let feedState = $derived<{
    _id: Id<"feed">;
    title: string;
    content: any;
    slug: string;
    type: string;
    public: boolean;
    createdBy: string;
    createdAt: number;
    updatedAt?: number;
  } | null>(data.feed);

  const convexClient = useConvexClient();
  let saving = $state<boolean>(false);
  let saveError = $state<string | null>(null);

  // Debounce timer for auto-saving
  let saveTimeout: NodeJS.Timeout | null = $state(null);

  // Unified update function that handles all field changes
  function queueUpdate(field: any, value: any) {
    if (!feedState) return;

    // Update local state immediately for optimistic UI
    (feedState as any)[field] = value;

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
          feedId: feedState!._id,
        };
        updateData[field] = value;

        await convexClient.mutation(api.feeds.feeds.updateFeed, updateData);
      } catch (err: unknown) {
        const error = err as Error;
        saveError = error.message;
        console.error('Update failed:', err);
      } finally {
        saving = false;
      }
    }, 2000); // 2 second debounce
  }

  // Handle content changes from the editor
  async function handleContentChange(newContent: any) {
    if (!feedState) return;
    queueUpdate('content', newContent);
  }

  // Handle title changes
  async function handleTitleChange() {
    if (!feedState) return;
    queueUpdate('title', feedState.title);
  }
</script>

<div class="container mx-auto py-8">
  {#if !data.feed}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <strong class="font-bold">Error! </strong>
      <span class="block sm:inline">{data.error || 'Feed not found'}</span>
    </div>
  {:else if !feedState}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <strong class="font-bold">Error! </strong>
      <span class="block sm:inline">Feed data not available</span>
    </div>
  {:else}
    <div class="mb-6">
      <input
        type="text"
        bind:value={feedState.title}
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
      content={feedState.content}
      feedId={feedState._id!}
      onChange={handleContentChange}
    />
  {/if}
</div>
