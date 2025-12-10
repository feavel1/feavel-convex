import { v } from 'convex/values';

// File validation constants
export const FILE_VALIDATION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ] as const,
  ALLOWED_AUDIO_TYPES: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
  ] as const,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
  ] as const,
};

// Type guards and validation utilities
export function isValidFileType(mimeType: string): boolean {
  return FILE_VALIDATION.ALLOWED_TYPES.includes(mimeType as any);
}

export function isValidFileSize(size: number): boolean {
  return size <= FILE_VALIDATION.MAX_FILE_SIZE;
}

export function validateFile(mimeType: string, size: number): void {
  if (!isValidFileType(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Allowed types: ${FILE_VALIDATION.ALLOWED_TYPES.join(', ')}`);
  }

  if (!isValidFileSize(size)) {
    throw new Error(`File size ${size} bytes exceeds maximum allowed size of ${FILE_VALIDATION.MAX_FILE_SIZE} bytes`);
  }
}