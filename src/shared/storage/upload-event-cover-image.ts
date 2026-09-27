import type { ImagePickerAsset } from 'expo-image-picker';
import { supabase } from '@/shared/auth/supabase';

const bucketName = 'event-covers';

export async function uploadEventCoverImage(image: ImagePickerAsset, userId: string) {
  if (image.fileSize && image.fileSize > 8 * 1024 * 1024) {
    throw new Error('Cover images must be 8 MB or smaller.');
  }

  const response = await fetch(image.uri);
  if (!response.ok) throw new Error('Could not read the selected cover image.');

  const imageData = await response.arrayBuffer();
  const mimeType = image.mimeType ?? 'image/jpeg';
  const extensionByMimeType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const extension = extensionByMimeType[mimeType];
  if (!extension) throw new Error('Choose a JPEG, PNG, or WebP image.');

  const objectPath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { data, error } = await supabase.storage.from(bucketName).upload(objectPath, imageData, {
    contentType: mimeType,
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) throw new Error(`Could not upload cover image: ${error.message}`);
  return supabase.storage.from(bucketName).getPublicUrl(data.path).data.publicUrl;
}
