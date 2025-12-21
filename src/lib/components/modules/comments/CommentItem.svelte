<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import MessageSquareReplyIcon from '@lucide/svelte/icons/message-square-reply';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import type { CommentProps } from './types';

	let { comment, feedId, depth = 0 }: CommentProps = $props();

	// Get current user using useQuery
	const currentUserResponse = useQuery(api.auth.getCurrentUser, {});
	const user = $derived(currentUserResponse.data);

	// State for managing replies and editing
	let showReplyForm = $state(false);
	let replyContent = $state('');
	let isEditing = $state(false);
	let editContent = $derived('');

	// Update editContent when comment.content changes
	$effect(() => {
		editContent = comment.content;
	});

	let showChildren = $state(false);

	// Get convex client for mutations
	const client = useConvexClient();

	// Queries for child comments
	const childCommentsQuery = $derived(
		showChildren
			? useQuery(api.feeds.comments.getChildCommentsWithUserInfo, { parentCommentId: comment._id })
			: null
	);

	// Check if current user is the comment author
	let isOwnComment = $derived(user?._id === comment.userId);

	// Handle adding a reply
	async function handleAddReply() {
		if (!replyContent.trim()) return;

		try {
			await client.mutation(api.feeds.comments.addComment, {
				feedId,
				content: replyContent.trim(),
				parentCommentId: comment._id
			});
			replyContent = '';
			showReplyForm = false;
		} catch (error) {
			console.error('Error adding reply:', error);
		}
	}

	// Handle updating comment
	async function handleUpdateComment() {
		if (!editContent.trim()) return;

		try {
			await client.mutation(api.feeds.comments.updateComment, {
				commentId: comment._id,
				content: editContent.trim()
			});
			isEditing = false;
		} catch (error) {
			console.error('Error updating comment:', error);
		}
	}

	// Handle deleting comment
	async function handleDeleteComment() {
		if (confirm('Are you sure you want to delete this comment?')) {
			try {
				await client.mutation(api.feeds.comments.deleteComment, {
					commentId: comment._id
				});
			} catch (error) {
				console.error('Error deleting comment:', error);
			}
		}
	}

	// Format date
	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class={`flex flex-col gap-2 ${depth > 0 ? 'ml-6' : ''}`}>
	<!-- User info section hidden for cleaner UI
	<div class="flex items-center gap-2">
		{#if comment.userInfo.image}
			<img
				src={comment.userInfo.image}
				alt={comment.userInfo.name || 'User'}
				class="h-8 w-8 rounded-full object-cover"
			/>
		{:else}
			<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
				<span class="text-xs font-medium text-gray-600">
					{comment.userInfo.name?.charAt(0) || '?'}
				</span>
			</div>
		{/if}
		<div class="flex-1">
			<div class="flex items-center gap-2">
				<span class="text-sm font-medium">
					{comment.userInfo.name || 'Anonymous'}
				</span>
				{#if comment.engagement.likeCount > 0}
					<span class="text-xs text-gray-500">
						{comment.engagement.likeCount} likes
					</span>
				{/if}
			</div>
			<span class="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
		</div>
	</div>
	-->

	{#if isEditing}
		<div class="mt-2">
			<textarea
				bind:value={editContent}
				placeholder="Edit your comment..."
				class="min-h-[80px] w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
			></textarea>
			<div class="mt-2 flex gap-2">
				<Button type="button" variant="outline" onclick={() => (isEditing = false)}>Cancel</Button>
				<Button type="button" onclick={handleUpdateComment}>Update</Button>
			</div>
		</div>
	{:else}
		<div class="mt-2 text-sm">
			{comment.content}
		</div>
	{/if}

	<div class="mt-2 flex items-center justify-between">
		<span class="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
		<div class="ml-auto flex items-center gap-2">
			<span
				role="button"
				tabindex="0"
				class="cursor-pointer text-gray-500 hover:text-gray-700"
				aria-label="Reply to comment"
				onclick={() => {
					if (user) {
						showReplyForm = !showReplyForm;
					} else {
						toast.error('Please log in to reply to comments');
					}
				}}
				onkeypress={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						if (user) {
							showReplyForm = !showReplyForm;
						} else {
							toast.error('Please log in to reply to comments');
						}
					}
				}}
			>
				<MessageSquareReplyIcon size={16} />
			</span>
			{#if isOwnComment}
				<span
					role="button"
					tabindex="0"
					class="cursor-pointer text-gray-500 hover:text-gray-700"
					aria-label="Edit comment"
					onclick={() => {
						if (user) {
							isEditing = true;
						} else {
							toast.error('Please log in to edit your comment');
						}
					}}
					onkeypress={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							if (user) {
								isEditing = true;
							} else {
								toast.error('Please log in to edit your comment');
							}
						}
					}}
				>
					<PencilIcon size={16} />
				</span>
				<span
					role="button"
					tabindex="0"
					class="cursor-pointer text-red-500 hover:text-red-700"
					aria-label="Delete comment"
					onclick={() => {
						if (user) {
							handleDeleteComment();
						} else {
							toast.error('Please log in to delete your comment');
						}
					}}
					onkeypress={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							if (user) {
								handleDeleteComment();
							} else {
								toast.error('Please log in to delete your comment');
							}
						}
					}}
				>
					<Trash2Icon size={16} />
				</span>
			{/if}
			{#if comment.engagement.replyCount > 0}
				<span
					role="button"
					tabindex="0"
					class="cursor-pointer text-gray-500 hover:text-gray-700"
					aria-label={showChildren
						? 'Hide replies'
						: `Show ${comment.engagement.replyCount} replies`}
					onclick={() => (showChildren = !showChildren)}
					onkeypress={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							showChildren = !showChildren;
						}
					}}
				>
					<ChevronDownIcon size={16} class={showChildren ? 'rotate-180' : ''} />
				</span>
			{/if}
		</div>
	</div>

	{#if showReplyForm}
		<div class="mt-2">
			<textarea
				bind:value={replyContent}
				placeholder="Write your reply..."
				class="min-h-[80px] w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
			></textarea>
			<div class="mt-2 flex gap-2">
				<Button type="button" variant="outline" onclick={() => (showReplyForm = false)}>
					Cancel
				</Button>
				<Button type="button" onclick={handleAddReply} disabled={!replyContent.trim()}>
					Reply
				</Button>
			</div>
		</div>
	{/if}

	<!-- Child comments -->
	{#if comment.engagement.replyCount > 0 && showChildren}
		<div class="mt-2">
			{#if childCommentsQuery && !childCommentsQuery.isLoading}
				<div class="mt-2 space-y-2">
					{#each childCommentsQuery.data || [] as childComment}
						{#await import('./CommentItem.svelte') then Component}
							<Component.default comment={childComment} {feedId} depth={depth + 1} />
						{/await}
					{/each}
				</div>
			{:else if childCommentsQuery && childCommentsQuery.isLoading}
				<div class="p-2 text-sm text-gray-500">Loading replies...</div>
			{/if}
		</div>
	{/if}
</div>
