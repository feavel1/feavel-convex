<script lang="ts">
	import type { Id, Doc } from '$convex/_generated/dataModel';

	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	import { toast } from 'svelte-sonner';

	// Shadcn-svelte components
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Upload } from '@lucide/svelte';

	let { feed, debouncedSave } = $props();

	let coverImageUrl = $state<string | null>(null);
	let coverImageUrlLoading = $state<boolean>(false);
	let coverImageUploading = $state<boolean>(false);
	let selectedCoverFile = $state<File | null>(null);
	let coverFileInput = $state<HTMLInputElement>();

	const convexClient = useConvexClient();

	// Handle file selection for upload
	function handleCoverFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				toast.error('Please select an image file');
				return;
			}

			// Validate file size (max 10MB to match account-settings.svelte)
			if (file.size > 10 * 1024 * 1024) {
				toast.error('Image must be less than 10MB');
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
			// Step 1: Generate upload URL from R2 storage
			const { url, key } = await convexClient.mutation(api.cfstorage.genCoverImageUploadURL, {});

			// Step 2: Upload file directly to R2
			const result = await fetch(url, {
				method: 'PUT',
				headers: { 'Content-Type': selectedCoverFile.type },
				body: selectedCoverFile
			});

			if (!result.ok) {
				throw new Error('Upload to R2 failed');
			}

			// Step 3: Update the reactive feed with the new R2 key
			// Note: feed.coverFileId was storing Convex storage ID, now we store the R2 key
			feed.coverFileId = key;
			debouncedSave();

			// Update the local state to show the uploaded image
			coverImageUrl = `https://storage.feavel.com/${key}`;

			// Clear selection and input
			selectedCoverFile = null;
			if (coverFileInput) {
				coverFileInput.value = '';
			}

			toast.success('Cover image uploaded successfully');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to upload image';
			console.error('Cover image upload failed:', error);
			toast.error(message);
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

	// Update cover image URL when feed.coverFileId changes
	$effect(() => {
		// With R2, we need to construct the URL from the R2 key
		if (feed?.coverFileId) {
			// If feed.coverFileId is already an R2 key (not a URL), construct the URL
			if (typeof feed.coverFileId === 'string' && !feed.coverFileId.startsWith('https://')) {
				coverImageUrl = `https://storage.feavel.com/${feed.coverFileId}`;
			} else if (typeof feed.coverFileId === 'string' && feed.coverFileId.startsWith('https://')) {
				// If it's already a full URL (for backwards compatibility with any existing URLs)
				coverImageUrl = feed.coverFileId;
			}
		} else {
			coverImageUrl = null;
		}
	});
</script>

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
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
			<p class="text-sm text-muted-foreground">PNG, JPG, or GIF up to 5MB.</p>
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
			<p class="text-sm text-muted-foreground">Paste an image link instead of uploading.</p>
		</div>
	</div>

	{#if coverImageUploading || coverImageUrlLoading}
		<div class="flex items-center text-sm text-blue-600">
			<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500"></div>
			{coverImageUploading ? 'Uploading...' : 'Loading...'}
		</div>
	{/if}
</div>
