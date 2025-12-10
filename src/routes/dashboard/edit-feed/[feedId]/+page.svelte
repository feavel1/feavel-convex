<script lang="ts">
  import { onMount } from 'svelte';
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '$convex/_generated/api.js';
  import Editor from "$lib/components/feed-editor/Editor.svelte";
  import type { Id } from "$convex/_generated/dataModel";

  // Shadcn-svelte components
  import * as Card from '$lib/components/ui/card/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Select from "$lib/components/ui/select/index.js";
  import { Switch } from '$lib/components/ui/switch';



  let { params } = $props();

  // Get feedId from URL params reactively
  let feedId: Id<"feed"> = $derived(params.feedId as Id<"feed">);

  // Get the feed data for real-time editing
  let feedQuery = $derived(useQuery(api.feeds.feeds.getFeedById, () => ({ feedId })));
  let feed = $derived(feedQuery.data);

  // Create derived content for Select trigger
  const feedTypeOptions = [
    { value: "article", label: "Article" },
    { value: "product", label: "Product" },
    { value: "service", label: "Service" },
    { value: "custom", label: "Custom" }
  ];


  // Feed public?
  let localFeedPublic = $derived<boolean | undefined>(feed?.public)

  // Local state for the select value to avoid binding issues
  let localFeedType = $derived<string | undefined>(feed?.type);
  // Use $derived to create trigger content
  const triggerContent = $derived(
    feedTypeOptions.find((option) => option.value === localFeedType)?.label ?? "Select a type"
  );

  // Synchronize localFeedType changes back to the reactive feed object
  $effect(() => {
    if (feed && localFeedType !== undefined && localFeedType !== feed.type) {
      feed.type = localFeedType;
      // Trigger the debounced save when feed type changes
      debouncedSave();
    }
  });


  const convexClient = useConvexClient();
  let saving = $state<boolean>(false);
  let saveError = $state<string | null>(null);
  let coverImageUploading = $state<boolean>(false);
  let lastUpdateByOther = $state<string | null>(null);

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

    // Set a new timeout to save after 2 seconds of inactivity
    saveTimeout = setTimeout(async () => {
      try {
        isCurrentlySaving = true;
        saving = true;
        saveError = null;

        const updateData = {
          feedId: feed._id,
          title: feed.title,
          type: localFeedType ?? feed.type, // Use localFeedType if available, fallback to original
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
    }, 2000); // 2 second debounce
  }

  // Simple function to handle meta updates with JSON validation
  function updateMeta(metaString: string) {
    try {
      // Parse the JSON to validate it
      const parsedMeta = metaString.trim() ? JSON.parse(metaString) : {};
      if (feed) {
        feed.meta = parsedMeta;
        debouncedSave();
      }
    } catch (error) {
      console.error('Invalid JSON in meta field:', error);
      // Don't update if JSON is invalid
    }
  }

  // Simple cover image upload handler
  async function handleCoverImageUpload(file: File) {
    coverImageUploading = true;
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      // Step 1: Generate upload URL
      const uploadUrl = await convexClient.mutation(api.storage.generateUploadUrl, {});

      // Step 2: Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file
      });

      const { storageId } = await result.json();

      // Step 3: Update the reactive feed with the new coverFileId
      if (feed) {
        feed.coverFileId = storageId;
        debouncedSave();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      console.error('Cover image upload failed:', error);
      saveError = message; // Use the main error state
    } finally {
      coverImageUploading = false;
    }
  }

  // Update cover image URL when feed changes or coverFileId changes
  let coverImageUrl = $state<string | null>(null);


  // $effect(() => {
  //   if (feed?.coverFileId) {
  //     (async () => {
  //       try {
  //         const url = await convexClient.mutation(api.storage.getImageUrl, { storageId: feed.coverFileId! });
  //         coverImageUrl = url;
  //       } catch (error) {
  //         console.error('Failed to get cover image URL:', error);
  //         coverImageUrl = null;
  //       }
  //     })();
  //   } else {
  //     coverImageUrl = null;
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

    <!-- Feed Settings Card -->
    <Card.Root class="mb-6">
      <Card.Header>
        <Card.Title>Feed Settings</Card.Title>
        <Card.Description>Configure your feed settings</Card.Description>
      </Card.Header>

      <Card.Content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Select.Root type="single" bind:value={localFeedType}>
              <Select.Trigger class="w-[180px]">
                {triggerContent}
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  <Select.Label>Feed Type</Select.Label>
                  {#each feedTypeOptions as option (option.value)}
                    <Select.Item
                      value={option.value}
                      label={option.label}
                    >
                      {option.label}
                    </Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>
            <Label for="feed-type-select" class="text-sm text-muted-foreground">Feed Type</Label>
          </div>

          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <Switch
                checked={localFeedPublic}
                onclick={() => {feed.public=localFeedPublic; debouncedSave()}}
              />
              <Label
                for="public-toggle"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Public
              </Label>
            </div>
            <p class="text-sm text-muted-foreground">Make this feed publicly accessible</p>
          </div>
        </div>


        <div class="grid grid-cols-1 gap-4 mt-4">

          <div class="space-y-2">
            <Input
              id="meta-json-input"
              type="text"
              value={feed.meta ? JSON.stringify(feed.meta) : '{}'}
              oninput={(e: Event) => {
                const value = ((e as InputEvent).target as HTMLInputElement).value;
                updateMeta(value);
              }}
              placeholder={JSON.stringify({key: "value"})}
              class="w-full"
            />
            <Label for="meta-json-input" class="text-sm text-muted-foreground">Meta (JSON)</Label>
          </div>


          <div class="space-y-2">
            <div class="flex flex-col gap-4">
              <div class="space-y-1">
                <Label for="cover-image-upload" class="text-sm font-semibold">Cover Image</Label>
                <p class="text-sm text-muted-foreground">Upload a cover image for your feed</p>
              </div>

              {#if coverImageUrl}
                <div class="relative max-w-xs">
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    class="max-w-full h-auto rounded-md border border-border object-cover"
                  />
                </div>
              {/if}

              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  id="cover-image-upload"
                  type="file"
                  accept="image/*"
                  onchange={(e) => {
                    const target = e.target as HTMLInputElement;
                    const file = target.files?.[0];
                    if (file) {
                      handleCoverImageUpload(file);
                    }
                  }}
                  disabled={coverImageUploading}
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {#if coverImageUploading}
                <div class="flex items-center text-sm text-blue-600">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  Uploading...
                </div>
              {/if}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <div class="mb-6">
      <input
        type="text"
        value={feed?.title ?? ''}
        oninput={() => {debouncedSave();}}
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
