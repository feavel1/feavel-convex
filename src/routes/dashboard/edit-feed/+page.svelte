<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	import { goto } from '$app/navigation';
	import type { Id } from '$convex/_generated/dataModel';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	const convexClient = useConvexClient();

	// Query to fetch user's feeds
	let feedsQuery = useQuery(api.feeds.feeds.unifiedFeedQuery, {});
	let feeds = $derived(feedsQuery.data?.feeds ?? []);

	let creating = $state(false);
	let error = $state<string | null>(null);
	let deletingFeedId = $state<Id<'feed'> | null>(null);
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);

	async function createNewFeed() {
		creating = true;
		error = null;

		try {
			// Create a new feed with default values
			const newFeedId = await convexClient.mutation(api.feeds.feeds.createFeed, {
				title: 'Untitled Feed',
				content: {}, // Empty Editor.js content
				type: 'article', // Default type
				public: false, // Default to private
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

	async function deleteFeed(feedId: Id<'feed'>) {
		deleting = true;
		deleteError = null;

		try {
			await convexClient.mutation(api.feeds.feeds.deleteFeed, { feedId });
			// The query will automatically update due to reactivity
		} catch (err: unknown) {
			const errorObj = err as Error;
			deleteError = errorObj.message || 'Failed to delete feed';
			console.error('Feed deletion failed:', err);
		} finally {
			deleting = false;
			deletingFeedId = null;
		}
	}

	// Function to format feed type into a readable format
	function formatFeedType(type: string | undefined): string {
		if (!type) return 'Untitled';
		const typeMap: Record<string, string> = {
			article: 'Article',
			product: 'Product',
			service: 'Service',
			custom: 'Custom'
		};
		return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
	}

	// Function to get badge variant based on feed type
	function getFeedTypeVariant(type: string | undefined): 'default' | 'secondary' | 'outline' {
		if (!type) return 'outline';
		switch (type) {
			case 'article':
				return 'default';
			case 'product':
				return 'secondary';
			case 'service':
				return 'outline';
			default:
				return 'outline';
		}
	}

	// Function to format creation date to a readable format
	function formatDate(date: number): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="flex-1 space-y-6 p-6 py-8 md:p-10">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">{m.sour_proof_camel_explore()}</h1>
			<p class="text-muted-foreground">View and manage your feeds</p>
		</div>
		<Button variant="default" class="w-fit" disabled={creating} onclick={createNewFeed}>
			{#if creating}
				<span class="flex items-center">
					<span class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
					Creating...
				</span>
			{:else}
				+ Create New Feed
			{/if}
		</Button>
	</div>

	<Separator />

	{#if feedsQuery.isLoading}
		<div class="flex h-64 items-center justify-center">
			<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
			<span class="ml-2">Loading feeds...</span>
		</div>
	{:else if feedsQuery.error}
		<div
			class="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
			role="alert"
		>
			<strong class="font-bold">Error! </strong>
			<span class="block sm:inline">{feedsQuery.error.message}</span>
		</div>
	{:else if feeds.length === 0}
		<div class="py-12 text-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="mx-auto h-12 w-12 text-muted-foreground"
			>
				<path d="M4 20h16"></path>
				<path d="M4 12h16"></path>
				<path d="M4 4h16"></path>
			</svg>
			<h3 class="mt-4 text-lg font-medium">No feeds yet</h3>
			<p class="mt-1 text-muted-foreground">Get started by creating a new feed.</p>
			<div class="mt-6">
				<Button variant="default" class="w-fit" disabled={creating} onclick={createNewFeed}>
					{#if creating}
						<span class="flex items-center">
							<span class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
							Creating...
						</span>
					{:else}
						+ Create New Feed
					{/if}
				</Button>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each feeds as feed (feed._id)}
				<Card.Root class="flex h-full flex-col">
					<Card.Header>
						<div class="flex items-start justify-between">
							<div class="min-w-0 flex-1">
								<Card.Title class="truncate">{feed.title}</Card.Title>
								<Card.Description class="mt-1 truncate">
									{feed.type ? formatFeedType(feed.type) : 'Untitled'}
								</Card.Description>
							</div>
							<Badge variant={getFeedTypeVariant(feed.type)} class="ml-2">
								{formatFeedType(feed.type)}
							</Badge>
						</div>
					</Card.Header>

					<Card.Content class="flex-1">
						<div class="space-y-2">
							<div class="flex items-center text-sm text-muted-foreground">
								<span>Created: {formatDate(feed.createdAt)}</span>
							</div>
							<div class="flex items-center text-sm">
								<span class="mr-2">
									{#if feed.public}
										<span class="text-green-600">Public</span>
									{:else}
										<span class="text-yellow-600">Private</span>
									{/if}
								</span>
							</div>
							{#if feed.meta?.author}
								<div class="text-sm text-muted-foreground">
									Author: {feed.meta.author}
								</div>
							{/if}
						</div>
					</Card.Content>

					<Card.Footer class="flex justify-between">
						<Button variant="outline" href="/feed/{feed.slug}" disabled={deleting}>View</Button>
						<div class="space-x-2">
							<Button variant="outline" href="/dashboard/edit-feed/{feed._id}" disabled={deleting}>
								Edit
							</Button>
							{#if deletingFeedId === feed._id}
								<div class="flex space-x-2">
									<Button
										variant="outline"
										onclick={() => (deletingFeedId = null)}
										disabled={deleting}
									>
										Cancel
									</Button>
									<Button
										variant="destructive"
										onclick={() => deleteFeed(feed._id)}
										disabled={deleting}
									>
										{#if deleting}
											<span class="flex items-center">
												<span class="mr-1 h-3 w-3 animate-spin rounded-full border-b-2 border-white"
												></span>
												Deleting...
											</span>
										{:else}
											Confirm
										{/if}
									</Button>
								</div>
							{:else}
								<Button
									variant="outline"
									onclick={() => (deletingFeedId = feed._id)}
									disabled={deleting}
									class="border-red-200 text-red-600 hover:bg-red-50"
								>
									Delete
								</Button>
							{/if}
						</div>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{/if}

	{#if error}
		<div
			class="fixed relative right-4 bottom-4 max-w-md rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
			role="alert"
		>
			<strong class="font-bold">Error! </strong>
			<span class="block sm:inline">{error}</span>
		</div>
	{/if}
</div>
