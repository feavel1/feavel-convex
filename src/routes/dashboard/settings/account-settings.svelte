<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { toast } from 'svelte-sonner';
	import { api } from '$convex/_generated/api.js';
	import { useConvexClient } from 'convex-svelte';

	interface Props {
		user: {
			name?: string;
			email?: string;
			image?: string | null;
		} | null;
	}

	let { user }: Props = $props();

	let isLoading = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let name = $state('');
	let image = $state('');

	const convexClient = useConvexClient();

	// Update reactive values when user changes
	$effect(() => {
		if (user) {
			name = user?.name || '';
			image = user?.image || '';
		}
	});

	// Consistent error handling function
	function handleOperationError(error: unknown, defaultMessage: string = 'Operation failed') {
		const message = error instanceof Error ? error.message : defaultMessage;
		toast.error(message);
		console.error(defaultMessage, error);
		return message;
	}

	async function handleUploadImage(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file');
			return;
		}

		// Validate file size (max 10MB based on validation.ts)
		if (file.size > 10 * 1024 * 1024) {
			toast.error('Image must be less than 10MB');
			return;
		}

		isLoading = true;
		try {
			// Get upload URL from the mutation
			const { url, key } = await convexClient.mutation(api.cfstorage.genAvatarUploadURL, {});

			// Upload file directly to R2 using fetch
			const result = await fetch(url, {
				method: 'PUT',
				headers: { 'Content-Type': file.type },
				body: file
			});

			console.log(result);

			if (!result.ok) {
				throw new Error('Upload to storage failed');
			}

			// Get the decorated URL for the uploaded image
			const decoratedUrl = `https://storage.feavel.com/${key}`;

			// Update the user profile with the new avatar URL
			await authClient.updateUser({
				name: name,
				image: decoratedUrl
			});

			// Update the local state
			image = decoratedUrl;

			// Reset file input
			if (fileInput) {
				fileInput.value = '';
			}

			toast.success('Image uploaded successfully');
		} catch (error) {
			handleOperationError(error, 'Failed to upload image');
		} finally {
			isLoading = false;
		}
	}

	async function handleRemoveImage() {
		isLoading = true;
		try {
			// Clear the image and update profile
			await authClient.updateUser({
				name,
				image: null
			});
			image = '';
			toast.success('Profile picture removed');
		} catch (error) {
			handleOperationError(error, 'Failed to remove image');
		} finally {
			isLoading = false;
		}
	}

	async function handleUpdateProfile(e: Event) {
		e.preventDefault();
		isLoading = true;

		try {
			await authClient.updateUser({
				name,
				image: image || null
			});

			toast.success('Profile updated successfully');
		} catch (error) {
			handleOperationError(error, 'Failed to update profile');
		} finally {
			isLoading = false;
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Account Information</Card.Title>
		<Card.Description>Update your account information here.</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleUpdateProfile} class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Name</Label>
				<Input id="name" type="text" bind:value={name} placeholder="Your name" required />
				<p class="text-sm text-muted-foreground">This is your public display name.</p>
			</div>

			<div class="space-y-4">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div class="space-y-1">
						<p class="text-sm font-semibold">Profile picture</p>
						<p class="text-sm text-muted-foreground">
							Upload an image or paste a link. We recommend a square image under 2MB.
						</p>
					</div>
					<div class="flex items-center gap-3">
						{#if image}
							<img
								src={image}
								alt="Profile preview"
								class="h-16 w-16 rounded-full border-2 border-border object-cover"
								onerror={(e) => {
									const target = e.target as HTMLImageElement;
									target.style.display = 'none';
								}}
							/>
						{:else}
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border text-xs text-muted-foreground"
							>
								No image
							</div>
						{/if}
						{#if image}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={handleRemoveImage}
								disabled={isLoading}
							>
								Remove
							</Button>
						{/if}
					</div>
				</div>

				<div class="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-start">
					<div class="space-y-2">
						<Label class="sr-only" for="file-upload">Upload a file</Label>
						<div class="flex gap-2">
							<input
								bind:this={fileInput}
								id="file-upload"
								type="file"
								accept="image/*"
								onchange={handleUploadImage}
								aria-describedby="file-helper"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							/>
						</div>
						<p id="file-helper" class="text-sm text-muted-foreground">
							PNG, JPG, or GIF up to 2MB.
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
						<Label class="sr-only" for="image">Link from URL</Label>
						<Input
							id="image"
							type="url"
							bind:value={image}
							placeholder="https://example.com/avatar.jpg"
							aria-describedby="image-helper"
						/>
						<p id="image-helper" class="text-sm text-muted-foreground">
							Paste an image link instead of uploading.
						</p>
					</div>
				</div>
			</div>

			<Button type="submit" disabled={isLoading}>
				{isLoading ? 'Saving...' : 'Save Changes'}
			</Button>
		</form>
	</Card.Content>
</Card.Root>
