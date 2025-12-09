import { api } from '$convex/_generated/api.js';

/**
 * Upload a file to Convex storage and associate it with a feed
 * @param file - The file to upload
 * @param feedId - The feed ID to associate the file with
 * @returns The upload result with file info
 */
export async function uploadFeedFileBrowser(file: File, feedId: string) {
  try {
    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'];
    const allowedTypes = [...allowedImageTypes, ...allowedAudioTypes];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Validate file size (max 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      throw new Error(`File size ${file.size} bytes exceeds maximum allowed size of ${maxFileSize} bytes`);
    }

    // Convert file to base64 using browser API
    const base64 = await fileToBase64(file);

    // Since we can't use getConvexClient in browser utils, let's create a client here
    // This function should be called from the browser, so use a client from the component
    throw new Error("This function needs convex client. Please use from component context.");
  } catch (error) {
    console.error('File upload failed:', error);
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// This version is meant to be called with the client available in the component
export async function uploadFeedFileWithClient(client: any, file: File, feedId: string) {
  try {
    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'];
    const allowedTypes = [...allowedImageTypes, ...allowedAudioTypes];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Validate file size (max 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      throw new Error(`File size ${file.size} bytes exceeds maximum allowed size of ${maxFileSize} bytes`);
    }

    // Convert file to base64 using browser API
    const base64 = await fileToBase64(file);

    // Upload the file using the convex action
    const result = await client.action(api.feeds.files.uploadFeedFile, {
      feedId,
      file: base64,
      fileName: file.name,
      mimeType: file.type,
    });

    return {
      success: 1,
      file: {
        url: result.url,
        name: result.fileName,
        mime: result.mimeType,
      }
    };
  } catch (error) {
    console.error('File upload failed:', error);
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}