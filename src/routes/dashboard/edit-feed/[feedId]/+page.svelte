<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	import Editor from '$lib/components/feed-editor/Editor.svelte';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import type { Id } from '$convex/_generated/dataModel';

	// Feed editor components
	import FeedSettingsCard from '$lib/components/feed-editor/FeedSettingsCard.svelte';
	import CoverImageManager from '$lib/components/feed-editor/CoverImageManager.svelte';
	import CollaboratorManager from '$lib/components/feed-editor/CollaboratorManager.svelte';
	import FeedTitleEditor from '$lib/components/feed-editor/FeedTitleEditor.svelte';

	let { params } = $props();

	// Get feedId from URL params reactively
	let feedId: Id<'feed'> = $derived(params.feedId as Id<'feed'>);

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

	// Track keyboard state for shortcut
	let is_ctrl_down = $state(false);
	let is_meta_down = $state(false); // For Cmd key on Mac
	let is_s_down = $state(false);

	// New function for immediate saving
	async function immediateSave() {
		if (!feed || isCurrentlySaving) return;

		try {
			isCurrentlySaving = true;
			saving = true;
			saveError = null;

			const updateData = {
				feedId: feed._id,
				title: feed.title,
				slug: feed.slug,
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
	}

	function handleSaveShortcut() {
		// Clear any existing auto-save timeout
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}

		// Trigger immediate save if not already saving
		if (!isCurrentlySaving && feed) {
			immediateSave();
		}
	}

	function on_key_down(event: KeyboardEvent) {
		// `keydown` event is fired while the physical key is held down.

		// Assuming you only want to handle the first press, we early
		// return to skip.
		if (event.repeat) return;

		// In the switch-case we're updating our boolean flags whenever the
		// desired bound keys are pressed.
		switch (event.key) {
			case 'Control':
				is_ctrl_down = true;
				break;
			case 'Meta': // Cmd key on Mac
				is_meta_down = true;
				break;
			case 's':
			case 'S':
				is_s_down = true;
				// Check if the key combination matches our save shortcut
				// On Mac: Cmd+S, on Windows/Linux: Ctrl+S
				// Only trigger if both modifier and S key are currently pressed
				if ((is_ctrl_down || is_meta_down) && is_s_down) {
					event.preventDefault(); // Prevent browser's default save behavior
					handleSaveShortcut();
				}
				break;
		}
	}

	function on_key_up(event: KeyboardEvent) {
		// `keyup` is the reverse, it fires whenever the physical key was let
		// go after being held down

		// Just like our `keydown` handler, we need to update the boolean
		// flags, but in the opposite direction.
		switch (event.key) {
			case 'Control':
				is_ctrl_down = false;
				break;
			case 'Meta': // Cmd key on Mac
				is_meta_down = false;
				break;
			case 's':
			case 'S':
				is_s_down = false;
				break;
		}
	}

	// Function to save the feed with debouncing
	function debouncedSave() {
		if (!feed || isCurrentlySaving) return;

		// Clear any existing timeout
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		// Set a new timeout to save after 15 seconds of inactivity
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
		}, 15000); // 15 second debounce
	}
</script>

<!-- Add the keyboard event listeners to the window -->
<svelte:window on:keydown={on_key_down} on:keyup={on_key_up} />

<div class="container mx-auto py-8">
	{#if isLoading}
		<div class="py-8 text-center">
			<div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
			<p class="mt-2">Loading...</p>
		</div>
	{:else if error}
		<div
			class="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
			role="alert"
		>
			<strong class="font-bold">Error! </strong>
			<span class="block sm:inline">{error.message}</span>
		</div>
	{:else if feed}
		<FeedSettingsCard {feed} {debouncedSave} />

		<CoverImageManager {feed} {debouncedSave} />

		<CollaboratorManager {feed} />

		<FeedTitleEditor {feed} {debouncedSave} />

		{#if saveError}
			<div
				class="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
				role="alert"
			>
				<strong class="font-bold">Save Error! </strong>
				<span class="block sm:inline">{saveError}</span>
			</div>
		{/if}

		<div class="mb-4 flex items-center justify-between">
			<span class="mr-4 text-sm text-gray-500">Status: {saving ? 'Saving...' : 'Saved'}</span>
			{#if saving}
				<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500"></div>
			{/if}
			<div class="text-sm text-muted-foreground">
				<Kbd.Group>
					<Kbd.Root>Ctrl + S</Kbd.Root>
				</Kbd.Group>
			</div>
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
		<div class="py-8 text-center">
			<div
				class="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
				role="alert"
			>
				<strong class="font-bold">Error! </strong>
				<span class="block sm:inline">Unable to access feed</span>
			</div>
		</div>
	{/if}
</div>
