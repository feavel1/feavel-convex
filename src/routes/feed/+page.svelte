<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { useQuery } from 'convex-svelte';
	import FeedLikes from '$lib/components/feed-helpers/FeedLikes.svelte';
	import { getLocale } from '$lib/paraglide/runtime.js';

	import { getContext } from 'svelte';
	import { onMount } from 'svelte';

	import * as Pagination from '$lib/components/ui/pagination/index.js';

	// Define the feed state context type
	type FeedState = {
		activeTab: {
			get: () => string;
			set: (v: string) => void;
		};
		currentPage: {
			get: () => number;
			set: (v: number) => void;
		};
		cursorMap: {
			get: () => Map<number, string | null>;
			set: (v: Map<number, string | null>) => void;
		};
	};

	// Define the feed type tabs
	const feedTypeTabs = [
		{ value: 'article', label: 'Articles', description: 'View public article feeds' },
		{ value: 'product', label: 'Products', description: 'View public product feeds' },
		{ value: 'service', label: 'Services', description: 'View public service feeds' }
	];

	// Get the context from the layout
	const feedState: FeedState | undefined = getContext('feed:state');

	// Remove the Separator import since we're not using it anymore

	// Reactive state for the active tab (for type filtering)
	let activeTab = $state('article');

	// Pagination state variables
	const perPage = 6; // Fixed at 6 per user request
	let currentPage = $state(1);
	let feedsCursor = $state<string | null>(null);
	let cursorMap = $state(new Map<number, string | null>());

	// Get current locale from paraglide
	let currentLocale = $derived(getLocale());

	// Get props and extract user
	const props = $props();
	const currentUser = $derived(props.data.currentUser);

	// Initialize state from context on mount
	onMount(() => {
		if (feedState) {
			activeTab = feedState.activeTab.get();
			currentPage = feedState.currentPage.get();
			cursorMap = feedState.cursorMap.get();
		}
	});

	// Update context whenever state changes
	$effect(() => {
		if (feedState) {
			feedState.activeTab.set(activeTab);
			feedState.currentPage.set(currentPage);
			feedState.cursorMap.set(cursorMap);
		}
	});

	// Format date for display
	function formatDate(date: number): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Create reactive query response that updates when activeTab or locale changes or pagination state changes
	const feedsResponse = $derived(
		useQuery(api.feeds.feeds.unifiedFeedQuery, {
			publicOnly: true,
			type: activeTab,
			language: currentLocale,
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

	// When currentPage changes, update feedsCursor based on cursorMap
	$effect(() => {
		if (currentPage === 1) {
			feedsCursor = null;
		} else if (cursorMap.has(currentPage)) {
			feedsCursor = cursorMap.get(currentPage) || null;
		}
	});
</script>

<svelte:head>
	<title>Feeds | Feavel</title>
</svelte:head>

<div class="mt-10 flex flex-1 flex-col">
	<div class="flex-1 space-y-6 p-6 md:p-10">
		<div>
			<h2 class="text-xl font-bold tracking-tight">Public Feed</h2>
			<p class="text-sm tracking-wide text-gray-600">
				Browse feed that is of your choice, <br />change language 🌐 in floating bar ⬆️.
			</p>
		</div>

		<!-- Feed Type Navigation with Underline -->
		<div class="space-y-6">
			<nav class="flex space-x-6 border-b">
				{#each feedTypeTabs as tab}
					<button
						type="button"
						class="pb-2 text-sm font-medium {activeTab === tab.value
							? 'border-b-2 border-black text-black dark:border-white dark:text-white'
							: 'text-gray-500'}"
						onclick={() => (activeTab = tab.value)}
					>
						{tab.label}
					</button>
				{/each}
			</nav>

			{#if feedsResponse.isLoading}
				<div class="flex items-center justify-center py-12">
					<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
				</div>
			{:else if feedsResponse.error}
				<div class="py-12 text-center">
					<p class="text-red-600">Error loading feeds: {feedsResponse.error.message}</p>
				</div>
			{:else if feeds && feeds.length > 0}
				<div class="min-h-[50vh]">
					<div class="flex flex-col space-y-4">
						{#each feeds as feed (feed._id)}
							<div class="border-b p-3">
								<div class="flex items-start justify-between">
									<a
										href={`/feed/${feed.slug}`}
										class="text-lg font-medium tracking-tight hover:underline"
									>
										{feed.title}
									</a>
									<!-- <div class="flex items-center gap-2 text-sm text-gray-500">
										<span class="rounded border px-1.5 py-0.5 text-xs">
											{feed.type}
										</span>
										<span>{formatDate(feed.createdAt)}</span>
									</div> -->
								</div>
								<p class="mt-1.5 line-clamp-2 text-sm text-gray-600">
									{feed.content &&
									Array.isArray(feed.content.blocks) &&
									feed.content.blocks.length > 0
										? feed.content.blocks
												.slice(0, 2)
												.map((block: any) => block.data?.text || '')
												.filter((text: string) => text)
												.join(' ')
												.substring(0, 100) + '...'
										: 'No content yet'}
								</p>
								<div class="mt-2 flex items-center justify-between text-sm">
									<FeedLikes
										feedId={feed._id}
										likeCount={feed.likeCount}
										isLiked={feed.isLiked}
										user={currentUser}
									/>
									<a href="/feed/{feed.slug}" class="text-primary hover:underline">
										View Details
									</a>
								</div>
							</div>
						{/each}
					</div>
				</div>
				<!-- Pagination -->
				{#if totalCount > perPage}
					<div class="mt-8 flex items-center justify-between">
						<!--
						<p class="text-sm text-muted-foreground">
       Showing {startIndex} to {endIndex} of {totalCount} feeds
      </p>
      -->
						<Pagination.Root count={totalCount} {perPage} bind:page={currentPage}>
							{#snippet children({ pages, currentPage: activePage })}
								<Pagination.Content>
									<Pagination.Item>
										<Pagination.PrevButton />
									</Pagination.Item>
									{#each pages as page (page.key)}
										{#if page.type === 'ellipsis'}
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
				<div class="py-12 text-center">
					<h3 class="mb-2 text-lg font-medium text-gray-800">
						No {activeTab.toLowerCase()} found
					</h3>
					<p class="mb-4 text-gray-600">
						{feedTypeTabs.find((tab) => tab.value === activeTab)?.description}
					</p>
					<a href="/dashboard/edit-feed/new" class="text-sm text-blue-600 hover:underline">
						Create Public Feed
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>
