<script lang="ts">
  import { api } from '$convex/_generated/api.js';
  import { useQuery } from 'convex-svelte';

  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
    import Separator from '$lib/components/ui/separator/separator.svelte';

  // Define the feed type tabs
  const feedTypeTabs = [
    { value: 'article', label: 'Articles', description: 'View public article feeds' },
    { value: 'product', label: 'Products', description: 'View public product feeds' },
    { value: 'service', label: 'Services', description: 'View public service feeds' },
  ];

  // Reactive state for the active tab
  let activeTab = $state('article');

  // Format date for display
  function formatDate(date: number): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  // Create reactive query response that updates when activeTab changes
  const feedsResponse = $derived(
    useQuery(api.feeds.feeds.unifiedFeedQuery, { publicOnly: true, type: activeTab })
  );

  const feeds = $derived(feedsResponse.data?.feeds || []);
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
                    <span class="text-xs">
                      {#if feed.public}
                        <span class="text-green-600">Public</span>
                      {:else}
                        <span class="text-yellow-600">Private</span>
                      {/if}
                    </span>
                    <Button size="sm" variant="outline" href = "/feed/{feed.slug}">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            {/each}
          </div>
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
