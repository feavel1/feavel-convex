<script lang="ts">
  import { api } from '$convex/_generated/api.js';
  import { useQuery } from 'convex-svelte';

  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import * as Pagination from '$lib/components/ui/pagination/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import Separator from '$lib/components/ui/separator/separator.svelte';
  import FeedLikes from '$lib/components/feed-helpers/FeedLikes.svelte';

  // Define the feed type tabs
  const feedTypeTabs = [
    { value: 'article', label: 'Articles', description: 'View public article feeds' },
    { value: 'product', label: 'Products', description: 'View public product feeds' },
    { value: 'service', label: 'Services', description: 'View public service feeds' },
  ];

  // Define the language tabs based on available languages
  const feedLanguageTabs = [
    { value: 'en', label: 'English', description: 'View feeds in English' },
    { value: 'zh', label: '中文', description: 'View feeds in Chinese' },
    { value: 'ru', label: 'Русский', description: 'View feeds in Russian' },
  ];

  // Reactive state for the active tab (for type filtering)
  let activeTab = $state('article');

  // Reactive state for the active language tab
  let activeLanguageTab = $state('en');

  // Pagination state variables
  let currentPage = $state(1);
  const perPage = 6; // Fixed at 6 per user request
  let feedsCursor = $state<string | null>(null);
  let cursorMap = $state(new Map<number, string | null>());

  // Format date for display
  function formatDate(date: number): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Create reactive query response that updates when activeTab or activeLanguageTab changes or pagination state changes
  const feedsResponse = $derived(
    useQuery(api.feeds.feeds.unifiedFeedQuery, {
      publicOnly: true,
      type: activeTab,
      language: activeLanguageTab,
      limit: perPage,
      cursor: feedsCursor || undefined
    })
  );

  const feeds = $derived(feedsResponse.data?.feeds || []);
  const nextCursor = $derived(feedsResponse.data?.nextCursor || null);
  const totalCount = $derived(feedsResponse.data?.totalCount || 0);

  // When a new cursor comes in, store it in our map
  $effect(() => {
    if (nextCursor && currentPage && !cursorMap.has(currentPage + 1)) {
      cursorMap.set(currentPage + 1, nextCursor);
    }
  });

  // When activeTab changes, reset pagination state
  $effect(() => {
    if (activeTab) {
      currentPage = 1;
      feedsCursor = null;
      cursorMap = new Map<number, string | null>();
    }
  });

  // When activeLanguageTab changes, reset pagination state
  $effect(() => {
    if (activeLanguageTab) {
      currentPage = 1;
      feedsCursor = null;
      cursorMap = new Map<number, string | null>();
    }
  });

  // When currentPage changes, update feedsCursor based on cursorMap
  $effect(() => {
    if (currentPage === 1) {
      feedsCursor = null;
    } else if (cursorMap.has(currentPage)) {
      feedsCursor = cursorMap.get(currentPage) || null;
    }
  });

  // Calculate pagination info
  const totalPages = $derived(Math.ceil(totalCount / perPage));
  const startIndex = $derived((currentPage - 1) * perPage + 1);
  const endIndex = $derived(Math.min(currentPage * perPage, totalCount));
</script>

<svelte:head>
  <title>Feeds | Feavel</title>
</svelte:head>


<div class="flex flex-1 flex-col">
	<div class="flex-1 space-y-6 p-6 md:p-10">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Public Feed</h2>
			<p class="text-muted-foreground">Browse feed that is of your choice</p>
		</div>

		<Separator />



    <!-- Language Filter -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">Filter by Language</h3>
      <div class="flex flex-wrap gap-2">
        {#each feedLanguageTabs as langTab}
          <button
            class={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeLanguageTab === langTab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            onclick={() => activeLanguageTab = langTab.value}
          >
            {langTab.label}
          </button>
        {/each}
      </div>
    </div>

  <!-- Feed Type Tabs -->
  <Tabs.Root bind:value={activeTab} class="space-y-6">
    <Tabs.List class="grid w-full grid-cols-3">
      {#each feedTypeTabs as tab}
        <Tabs.Trigger value={tab.value} class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          {tab.label}
        </Tabs.Trigger>
      {/each}
    </Tabs.List>

    <!-- Content for each tab -->
    {#each feedTypeTabs as tab}
      <Tabs.Content value={tab.value} class="space-y-6">
        {#if feedsResponse.isLoading}
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        {:else if feedsResponse.error}
          <div class="text-center py-12">
            <p class="text-red-500">Error loading feeds: {feedsResponse.error.message}</p>
          </div>
        {:else if feeds && feeds.length > 0}
        <div class="min-h-[50vh]">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each feeds as feed (feed._id)}
              <Card class="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle class="text-lg">
                    <a href={`/feed/${feed.slug}`} class="hover:underline">
                      {feed.title}
                    </a>
                  </CardTitle>
                  <div class="flex items-center text-sm text-muted-foreground gap-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {feed.type}
                    </span>
                    <span>{formatDate(feed.createdAt)}</span>
                  </div>
                </CardHeader>
                <CardContent class="pb-4">
                  <p class="text-sm text-muted-foreground line-clamp-2">
                    {feed.content && Array.isArray(feed.content.blocks) && feed.content.blocks.length > 0
                      ? feed.content.blocks
                          .slice(0, 2)
                          .map((block: any) => block.data?.text || '')
                          .filter((text: string) => text)
                          .join(' ')
                          .substring(0, 100) + '...'
                      : 'No content yet'}
                  </p>
                  <div class="mt-4 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                      <FeedLikes feedId={feed._id} />
                      <!-- <span class="text-xs">
                        {#if feed.public}
                          <span class="text-green-600">Public</span>
                        {:else}
                          <span class="text-yellow-600">Private</span>
                        {/if}
                      </span> -->
                    </div>
                    <Button size="sm" variant="outline" href = "/feed/{feed.slug}">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            {/each}
          </div>
        </div>
          <!-- Pagination -->
          {#if totalCount > perPage}
            <div class="mt-8 flex items-center justify-between">
              <!-- <p class="text-sm text-muted-foreground">
                Showing {startIndex} to {endIndex} of {totalCount} feeds
              </p> -->
              <Pagination.Root count={totalCount} perPage={perPage} bind:page={currentPage}>
                {#snippet children({ pages, currentPage: activePage })}
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.PrevButton />
                    </Pagination.Item>
                    {#each pages as page (page.key)}
                      {#if page.type === "ellipsis"}
                        <Pagination.Item>
                          <Pagination.Ellipsis />
                        </Pagination.Item>
                      {:else}
                        <Pagination.Item>
                          <Pagination.Link {page} isActive={activePage === page.value}>
                            {page.value}
                          </Pagination.Link>
                        </Pagination.Item>
                      {/if}
                    {/each}
                    <Pagination.Item>
                      <Pagination.NextButton />
                    </Pagination.Item>
                  </Pagination.Content>
                {/snippet}
              </Pagination.Root>
            </div>
          {/if}
        {:else}
          <div class="text-center py-12">
            <h3 class="text-lg font-medium text-gray-900 mb-2">No {tab.label.toLowerCase()} found</h3>
            <p class="text-muted-foreground mb-4">{tab.description}</p>
            <Button href="/dashboard/edit-feed/new">
              Create Public Feed
            </Button>
          </div>
        {/if}
      </Tabs.Content>
    {/each}
  </Tabs.Root>
	</div>
</div>
