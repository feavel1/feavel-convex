<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '$convex/_generated/api.js';
  import Editor from "$lib/components/feed-editor/Editor.svelte";
  import type { Id } from "$convex/_generated/dataModel";

  // Shadcn-svelte components
  import * as Card from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Select from "$lib/components/ui/select/index.js";
  import { Switch } from '$lib/components/ui/switch';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Upload } from '@lucide/svelte';

  let { params } = $props();

  // Get feedId from URL params reactively
  let feedId: Id<"feed"> = $derived(params.feedId as Id<"feed">);

  // Get the feed data for real-time editing using unified function
  let feedQuery = useQuery(api.feeds.feeds.unifiedFeedQuery, () => ({ feedIds: [feedId] }));
  let feed = $derived(feedQuery.data?.feeds?.[0]);

  // Create derived content for Select trigger
  const feedTypeOptions = [
    { value: "article", label: "Article" },
    { value: "product", label: "Product" },
    { value: "service", label: "Service" },
    { value: "custom", label: "Custom" }
  ];

  // Local state for the select value to avoid binding issues with reactive feed object
  let localFeedType = $derived<string | undefined>(feed?.type);

  // Use $derived to create trigger content
  const triggerContent = $derived(
    feedTypeOptions.find((option) => option.value === localFeedType)?.label ?? "Select a type"
  );

  // Update feed.type when localFeedType changes
  $effect(() => {
    if (feed && localFeedType && localFeedType !== feed.type) {
      feed.type = localFeedType;
      debouncedSave();
    }
  });

  // Meta data state variables
  interface ArticleMeta {
    keywords: string;
    author: string;
    links: string;
  }

  interface ServiceMeta {
    links: string;
    priceRange: string;
    estimateTime: string;
  }

  interface ProductMeta {
    links: string;
    price: string;
  }

  let articleMeta = $state<ArticleMeta>({
    keywords: '',
    author: '',
    links: ''
  });

  let serviceMeta = $state<ServiceMeta>({
    links: '',
    priceRange: '',
    estimateTime: ''
  });

  let productMeta = $state<ProductMeta>({
    links: '',
    price: ''
  });

  function initializeMetaFromFeed() {
    if (!feed?.meta) return;
    const meta: any = feed.meta;

    // Initialize article meta
    articleMeta.keywords = Array.isArray(meta.keywords) ? meta.keywords.join(', ') : (typeof meta.keywords === 'string' ? meta.keywords : '');
    articleMeta.author = meta.author || '';
    articleMeta.links = Array.isArray(meta.links) ? meta.links.join(', ') : (typeof meta.links === 'string' ? meta.links : '');

    // Initialize service meta
    serviceMeta.links = Array.isArray(meta.service?.links) ? meta.service.links.join(', ') : (typeof meta.service?.links === 'string' ? meta.service.links : '');
    serviceMeta.priceRange = meta.service?.priceRange || '';
    serviceMeta.estimateTime = meta.service?.estimateTime || '';

    // Initialize product meta
    productMeta.links = Array.isArray(meta.product?.links) ? meta.product.links.join(', ') : (typeof meta.product?.links === 'string' ? meta.product.links : '');
    productMeta.price = meta.product?.price || '';
  }

  // Initialize meta when feed is loaded (this will run once)
  $effect(() => {
    if (feed && !initializedMeta) {
      initializeMetaFromFeed();
      initializedMeta = true;
    }
  });

  // Track whether meta has been initialized
  let initializedMeta = $state<boolean>(false);

  // Convert meta objects to feed meta format and update (preserving other meta fields)
  function updateArticleMeta() {
    if (!feed) return;

    const keywordsArray = articleMeta.keywords.split(',').map(s => s.trim()).filter(s => s);
    const linksArray = articleMeta.links.split(',').map(s => s.trim()).filter(s => s);

    // Preserve existing meta properties and only update article-specific ones
    feed.meta = {
      ...feed.meta,
      keywords: keywordsArray,
      author: articleMeta.author,
      links: linksArray
    };

    debouncedSave();
  }

  function updateServiceMeta() {
    if (!feed) return;

    const linksArray = serviceMeta.links.split(',').map(s => s.trim()).filter(s => s);

    // Preserve existing meta properties and only update service-specific ones
    feed.meta = {
      ...feed.meta,
      service: {
        ...feed.meta?.service, // Preserve other service properties if they exist
        links: linksArray,
        priceRange: serviceMeta.priceRange,
        estimateTime: serviceMeta.estimateTime
      }
    };

    debouncedSave();
  }

  function updateProductMeta() {
    if (!feed) return;

    const linksArray = productMeta.links.split(',').map(s => s.trim()).filter(s => s);
    const priceNumber = parseFloat(productMeta.price) || 0;

    // Preserve existing meta properties and only update product-specific ones
    feed.meta = {
      ...feed.meta,
      product: {
        ...feed.meta?.product, // Preserve other product properties if they exist
        links: linksArray,
        price: priceNumber
      }
    };

    debouncedSave();
  }

  const convexClient = useConvexClient();
  let saving = $state<boolean>(false);
  let saveError = $state<string | null>(null);
  let coverImageUploading = $state<boolean>(false);

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
          type: feed.type,
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
    }, 3000); // 2 second debounce
  }

  // Simple function to handle meta updates with JSON validation for fallback
  function updateMeta(metaString: string) {
    try {
      // Parse the JSON to validate it
      const parsedMeta = metaString.trim() ? JSON.parse(metaString) : {};
      if (feed) {
        feed.meta = parsedMeta;
        // Update the form fields to match the new JSON data
        if (parsedMeta.keywords) {
          articleMeta.keywords = Array.isArray(parsedMeta.keywords) ? parsedMeta.keywords.join(', ') : parsedMeta.keywords;
        }
        if (parsedMeta.author) {
          articleMeta.author = parsedMeta.author;
        }
        if (parsedMeta.links) {
          articleMeta.links = Array.isArray(parsedMeta.links) ? parsedMeta.links.join(', ') : parsedMeta.links;
        }
        if (parsedMeta.service) {
          if (Array.isArray(parsedMeta.service.links)) {
            serviceMeta.links = parsedMeta.service.links.join(', ');
          } else if (typeof parsedMeta.service.links === 'string') {
            serviceMeta.links = parsedMeta.service.links;
          }
          serviceMeta.priceRange = parsedMeta.service.priceRange || '';
          serviceMeta.estimateTime = parsedMeta.service.estimateTime || '';
        }
        if (parsedMeta.product) {
          if (Array.isArray(parsedMeta.product.links)) {
            productMeta.links = parsedMeta.product.links.join(', ');
          } else if (typeof parsedMeta.product.links === 'string') {
            productMeta.links = parsedMeta.product.links;
          }
          productMeta.price = parsedMeta.product.price || '';
        }

        debouncedSave();
      }
    } catch (error) {
      console.error('Invalid JSON in meta field:', error);
      // Don't update if JSON is invalid
    }
  }

  // Handle file selection for upload
  function handleCoverFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        saveError = 'Please select an image file';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        saveError = 'Image must be less than 5MB';
        return;
      }

      selectedCoverFile = file;
    }
  }

  // Cover image upload handler
  async function handleCoverImageUpload() {
    if (!selectedCoverFile || !feed) return;

    coverImageUploading = true;
    try {
      // Step 1: Generate upload URL
      const uploadUrl = await convexClient.mutation(api.storage.generateUploadUrl, {});

      // Step 2: Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': selectedCoverFile.type },
        body: selectedCoverFile
      });

      const { storageId } = await result.json();

      // Step 3: Update the reactive feed with the new coverFileId
      feed.coverFileId = storageId;
      debouncedSave();

      // Clear selection and input
      selectedCoverFile = null;
      if (coverFileInput) {
        coverFileInput.value = '';
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      console.error('Cover image upload failed:', error);
      saveError = message;
    } finally {
      coverImageUploading = false;
    }
  }

  // Remove cover image handler
  async function handleRemoveCoverImage() {
    if (feed) {
      feed.coverFileId = undefined;
      coverImageUrl = null;
      debouncedSave();
    }
  }

  // Update cover image URL when feed changes or coverFileId changes
  let coverImageUrl = $state<string | null>(null);
  let coverImageUrlLoading = $state<boolean>(false);
  let selectedCoverFile = $state<File | null>(null);
  let coverFileInput = $state<HTMLInputElement>();

  // Load cover image URL when feed.coverFileId changes
  $effect(() => {
    if (feed?.coverFileId) {
      loadCoverImageUrl(feed.coverFileId);
    } else {
      coverImageUrl = null;
    }
  });

  async function loadCoverImageUrl(storageId: Id<'_storage'>) {
    if (!storageId) return;

    coverImageUrlLoading = true;
    try {
      const imageUrl = await convexClient.mutation(api.storage.getImageUrl, { storageId });
      coverImageUrl = imageUrl;
    } catch (error) {
      console.error('Failed to load cover image URL:', error);
      coverImageUrl = null;
    } finally {
      coverImageUrlLoading = false;
    }
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

    <!-- Feed Settings Card -->
    <Card.Root class="mb-6">
      <Card.Header>
        <Card.Title>Feed Settings</Card.Title>
        <Card.Description>Configure your feed settings</Card.Description>
      </Card.Header>

      <Card.Content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Select.Root
              type="single"
              bind:value={localFeedType}
            >
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
                checked={feed.public}
                onclick={() => {feed.public=!feed.public; debouncedSave()}}
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
          <!-- Feed Type Specific Meta Editor -->
          <div class="space-y-4">
            <Label class="text-sm font-semibold">Meta Information</Label>
            <p class="text-sm text-muted-foreground">Enter metadata specific to your feed type</p>

            {#if feed?.type === 'article'}
              <!-- Article Meta Fields -->
              <div class="space-y-3">
                <div class="space-y-2">
                  <Label for="meta-keywords" class="text-sm">Keywords</Label>
                  <Input
                    id="meta-keywords"
                    type="text"
                    bind:value={articleMeta.keywords}
                    oninput={() => {
                      updateArticleMeta();
                    }}
                    placeholder="Enter keywords separated by commas"
                    class="w-full"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="meta-author" class="text-sm">Author</Label>
                  <Input
                    id="meta-author"
                    type="text"
                    bind:value={articleMeta.author}
                    oninput={() => {
                      updateArticleMeta();
                    }}
                    placeholder="Enter author name"
                    class="w-full"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="meta-links" class="text-sm">Links</Label>
                  <Input
                    id="meta-links"
                    type="text"
                    bind:value={articleMeta.links}
                    oninput={() => {
                      updateArticleMeta();
                    }}
                    placeholder="Enter links separated by commas"
                    class="w-full"
                  />
                </div>
              </div>
            {:else if feed?.type === 'service'}
              <!-- Service Meta Fields -->
              <div class="space-y-3">
                <div class="space-y-2">
                  <Label for="service-links" class="text-sm">Links</Label>
                  <Input
                    id="service-links"
                    type="text"
                    bind:value={serviceMeta.links}
                    oninput={() => {
                      updateServiceMeta();
                    }}
                    placeholder="Enter links separated by commas"
                    class="w-full"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="service-price-range" class="text-sm">Price Range</Label>
                  <Input
                    id="service-price-range"
                    type="text"
                    bind:value={serviceMeta.priceRange}
                    oninput={() => {
                      updateServiceMeta();
                    }}
                    placeholder="e.g., $100 - $500"
                    class="w-full"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="service-estimate-time" class="text-sm">Estimate Time</Label>
                  <Input
                    id="service-estimate-time"
                    type="text"
                    bind:value={serviceMeta.estimateTime}
                    oninput={() => {
                      updateServiceMeta();
                    }}
                    placeholder="e.g., 2-3 weeks"
                    class="w-full"
                  />
                </div>
              </div>
            {:else if feed?.type === 'product' || feed?.type === 'custom'}
              <!-- Product/Custom Meta Fields -->
              <div class="space-y-3">
                <div class="space-y-2">
                  <Label for="product-links" class="text-sm">Links</Label>
                  <Input
                    id="product-links"
                    type="text"
                    bind:value={productMeta.links}
                    oninput={() => {
                      updateProductMeta();
                    }}
                    placeholder="Enter links separated by commas"
                    class="w-full"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="product-price" class="text-sm">Price</Label>
                  <Input
                    id="product-price"
                    type="number"
                    bind:value={productMeta.price}
                    oninput={() => {
                      updateProductMeta();
                    }}
                    placeholder="Enter price"
                    class="w-full"
                  />
                </div>
              </div>
            {:else}
              <!-- Fallback to JSON input for other types -->
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
            {/if}
          </div>


          <div class="space-y-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-y-1">
                <p class="text-sm font-semibold">Cover image</p>
                <p class="text-sm text-muted-foreground">
                  Upload an image or paste a link. We recommend an image under 5MB.
                </p>
              </div>
              <div class="flex items-center gap-3">
                {#if coverImageUrl}
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    class="h-16 w-16 rounded-md border-2 border-border object-cover"
                    onerror={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                {:else}
                  <div
                    class="flex h-16 w-16 items-center justify-center rounded-md border-2 border-dashed border-border text-xs text-muted-foreground"
                  >
                    No image
                  </div>
                {/if}
                {#if coverImageUrl}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onclick={handleRemoveCoverImage}
                    disabled={coverImageUploading || coverImageUrlLoading}
                  >
                    Remove
                  </Button>
                {/if}
              </div>
            </div>

            <div class="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-start">
              <div class="space-y-2">
                <Label class="sr-only" for="cover-file-upload">Upload a file</Label>
                <div class="flex gap-2">
                  <input
                    bind:this={coverFileInput}
                    id="cover-file-upload"
                    type="file"
                    accept="image/*"
                    onchange={handleCoverFileSelect}
                    disabled={coverImageUploading || coverImageUrlLoading}
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onclick={handleCoverImageUpload}
                    disabled={!selectedCoverFile || coverImageUploading || coverImageUrlLoading}
                  >
                    <Upload class="h-4 w-4" />
                  </Button>
                </div>
                <p class="text-sm text-muted-foreground">
                  PNG, JPG, or GIF up to 5MB.
                </p>
              </div>

              <div class="flex items-center justify-center">
                <div
                  class="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase"
                >
                  <span class="hidden h-px w-8 bg-border md:block" aria-hidden="true"></span>
                  <span>or</span>
                  <span class="hidden h-px w-8 bg-border md:block" aria-hidden="true"></span>
                </div>
              </div>

              <div class="space-y-2">
                <Label class="sr-only" for="cover-image-url">Link from URL</Label>
                <Input
                  id="cover-image-url"
                  type="url"
                  bind:value={coverImageUrl}
                  placeholder="https://example.com/cover.jpg"
                  disabled={coverImageUploading || coverImageUrlLoading}
                  oninput={() => debouncedSave()}
                  class="w-full"
                />
                <p class="text-sm text-muted-foreground">
                  Paste an image link instead of uploading.
                </p>
              </div>
            </div>

            {#if coverImageUploading || coverImageUrlLoading}
              <div class="flex items-center text-sm text-blue-600">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                {coverImageUploading ? 'Uploading...' : 'Loading...'}
              </div>
            {/if}
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <div class="mb-6">
      <input
        type="text"
        value={feed?.title ?? ''}
               oninput={(e) => {
                 const newTitle = (e.target as HTMLInputElement).value;
                 if (feed) {
                   feed.title = newTitle;
                   debouncedSave();
                 }
               }}
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
