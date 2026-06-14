/**
 * File preview helper service for categorization and strategy selection.
 */

export const CATEGORIES_MAP = {
  image: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ],
  pdf: [
    'application/pdf'
  ],
  office: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/ogg'
  ],
  audio: [
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp3'
  ],
  text: [
    'text/plain',
    'text/csv'
  ],
  archive: [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed'
  ]
};

/**
 * Get category type for a MIME type
 * @param {string} mimeType 
 * @returns {string} One of: image, pdf, office, video, audio, text, archive, unknown
 */
export const getFileCategory = (mimeType) => {
  if (!mimeType) return 'unknown';
  
  const cleanMime = mimeType.toLowerCase();
  
  for (const [category, mimeList] of Object.entries(CATEGORIES_MAP)) {
    if (mimeList.includes(cleanMime)) {
      return category;
    }
  }
  
  // Custom fallback checks if needed
  if (cleanMime.startsWith('image/')) return 'image';
  if (cleanMime.startsWith('video/')) return 'video';
  if (cleanMime.startsWith('audio/')) return 'audio';
  if (cleanMime.startsWith('text/')) return 'text';
  
  return 'unknown';
};

/**
 * Check if the file can be previewed natively in the browser
 * @param {string} mimeType 
 * @returns {boolean}
 */
export const canPreviewInBrowser = (mimeType) => {
  const category = getFileCategory(mimeType);
  return ['image', 'pdf', 'video', 'audio', 'text'].includes(category);
};

/**
 * Get the preview strategy for a MIME type
 * @param {string} mimeType 
 * @returns {string} One of: 'native' | 'google_viewer' | 'download_only'
 */
export const getPreviewStrategy = (mimeType) => {
  const category = getFileCategory(mimeType);
  
  if (['image', 'pdf', 'video', 'audio', 'text'].includes(category)) {
    return 'native';
  }
  if (category === 'office') {
    return 'google_viewer';
  }
  return 'download_only';
};
