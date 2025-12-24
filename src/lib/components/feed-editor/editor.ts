import { api } from '$convex/_generated/api.js';

// This version is meant to be called with the client available in the component
export async function uploadFeedFileWithClient(client: any, file: File, feedId: string) {
	try {
		// Validate file type - allow both images and audio
		const isImage = file.type.startsWith('image/');
		const isAudio = file.type.startsWith('audio/');

		if (!isImage && !isAudio) {
			throw new Error('Only image and audio files are supported');
		}

		// Validate file size (max 10MB to match account-settings.svelte)
		if (file.size > 10 * 1024 * 1024) {
			throw new Error('File must be less than 10MB');
		}

		// Step 1: Generate upload URL from R2 storage
		const { url, key } = await client.mutation(api.cfstorage.genFeedFileUploadURL, {});

		// Step 2: Upload file directly to R2
		const result = await fetch(url, {
			method: 'PUT',
			headers: { 'Content-Type': file.type },
			body: file
		});

		if (!result.ok) {
			throw new Error(`Failed to upload file to R2: ${result.statusText}`);
		}

		// Step 3: Get the decorated URL for the uploaded image
		const decoratedUrl = `https://storage.feavel.com/${key}`;

		return {
			success: 1,
			file: {
				url: decoratedUrl,
				name: file.name,
				mime: file.type
			}
		};
	} catch (error) {
		console.error('File upload failed:', error);
		throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}
