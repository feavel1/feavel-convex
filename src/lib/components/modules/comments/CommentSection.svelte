<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { Button } from '$lib/components/ui/button';
	import CommentItem from './CommentItem.svelte';
	import type { Id } from '$convex/_generated/dataModel';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	interface FeedProps {
		feed: {
			_id: Id<'feed'>;
			// Add other feed properties as needed
		};
	}

	let { feed }: FeedProps = $props();

	// Get current user using useQuery
	const currentUserResponse = useQuery(api.auth.getCurrentUser, {});
	const user = $derived(currentUserResponse.data);

	// State for adding new comments
	let newComment = $state('');

	// Get convex client for mutations
	const client = useConvexClient();

	// Queries - Fixed to use proper reactive updates
	const commentsQuery = $derived(
		useQuery(api.feeds.comments.getTopLevelCommentsWithUserInfo, {
			feedId: feed._id
		}) || []
	);

	// Handle adding a top-level comment
	async function handleAddComment() {
		if (!newComment.trim()) return;
		console.log('function ran');

		try {
			await client.mutation(api.feeds.comments.addComment, {
				feedId: feed._id,
				content: newComment.trim()
			});
			newComment = '';
		} catch (error) {
			console.error('Error adding comment:', error);
		}
	}
</script>

<div class="space-y-6">
	{#if user}
		<div class="mb-8">
			<div class="flex items-start gap-4">
				{#if user.image}
					<img
						src={user.image}
						alt={user.name || 'User'}
						class="h-10 w-10 rounded-full object-cover"
					/>
				{:else}
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
						<span class="text-sm font-medium text-gray-600">
							{user.name?.charAt(0) || '?'}
						</span>
					</div>
				{/if}
				<div class="flex-1">
					<textarea
						bind:value={newComment}
						placeholder="Add a comment..."
						class="min-h-[100px] w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
					></textarea>
					<div class="mt-2 flex justify-end">
						<Button onclick={handleAddComment} disabled={!newComment.trim()}>Post Comment</Button>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="mb-8 text-center text-gray-500">
			<p>Please log in to leave a comment.</p>
		</div>
	{/if}

	{#if !commentsQuery.isLoading && commentsQuery.data && commentsQuery.data.length > 0}
		<div class="space-y-4">
			{#each commentsQuery.data as comment}
				<CommentItem {comment} feedId={feed._id} />
				<Separator />
			{/each}
		</div>
	{:else if commentsQuery && !commentsQuery.isLoading}
		<div class="py-8 text-center text-gray-500">
			<p>No comments yet. Be the first to comment!</p>
		</div>
	{:else}
		<div class="py-8 text-center">
			<p>Loading comments...</p>
		</div>
	{/if}
</div>
