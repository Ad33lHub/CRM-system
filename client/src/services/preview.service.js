/**
 * Helper to categorize files for different previewers.
 * @param {String} mimeType 
 * @param {String} fileName 
 * @returns {String} category
 */
export const getMimeCategory = (mimeType, fileName = '') => {
  const type = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  
  // Office formats
  const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
  if (officeExtensions.some(ext => name.endsWith(ext)) || [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ].includes(type)) {
    return 'office';
  }

  // Text formats
  const textExtensions = ['.txt', '.csv', '.json', '.xml', '.md', '.log'];
  if (textExtensions.some(ext => name.endsWith(ext)) || type.startsWith('text/') || type === 'application/json') {
    return 'text';
  }

  return 'fallback';
};

/**
 * Returns Google Docs viewer embedded URL for Office documents.
 * @param {String} url 
 * @returns {String}
 */
export const getGoogleViewerUrl = (url) => {
  return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
};
