import { api } from '$convex/_generated/api.js';

// This version is meant to be called with the client available in the component
export async function uploadFeedFileWithClient(client: any, file: File, feedId: string) {
  try {
    // Step 1: Generate upload URL using the storage mutation
    const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {});

    // Step 2: Upload file directly to Convex storage
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file
    });

    if (!result.ok) {
      throw new Error(`Failed to upload file: ${result.statusText}`);
    }

    const { storageId } = await result.json();

    // Step 3: Call the mutation to associate the file with the feed (passing the storageId)
    const fileResult = await client.mutation(api.storage.uploadFeedFile, {
      feedId,
      storageId,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size, // Add file size for validation on the server-side
    });

    return {
      success: 1,
      file: {
        url: fileResult.url,
        name: fileResult.fileName,
        mime: fileResult.mimeType,
      }
    };
  } catch (error) {
    console.error('File upload failed:', error);
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}