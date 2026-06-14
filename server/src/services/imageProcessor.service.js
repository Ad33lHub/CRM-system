import sharp from 'sharp';

/**
 * Processes a profile image: rotates based on EXIF, resizes to exactly 400x400 cover, and converts to WebP.
 * @param {Buffer} inputBuffer
 * @returns {Promise<Buffer>}
 */
export const processProfileImage = async (inputBuffer) => {
  return sharp(inputBuffer)
    .rotate()
    .resize(400, 400, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 85 })
    .toBuffer();
};

/**
 * Processes a thumbnail image with custom dimensions and lower quality.
 * @param {Buffer} inputBuffer
 * @param {Number} width
 * @param {Number} height
 * @returns {Promise<Buffer>}
 */
export const processThumbnail = async (inputBuffer, width = 200, height = 200) => {
  return sharp(inputBuffer)
    .rotate()
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 70 })
    .toBuffer();
};

/**
 * Processes a document preview image (resizes to max 1200px width, maintains aspect ratio).
 * @param {Buffer} inputBuffer
 * @returns {Promise<Buffer>}
 */
export const processDocumentPreview = async (inputBuffer) => {
  return sharp(inputBuffer)
    .rotate()
    .resize({
      width: 1200,
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
};

/**
 * Validates that an image meets the minimum and maximum dimensions.
 * @param {Buffer} buffer
 * @returns {Promise<Object>}
 */
export const validateImageDimensions = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width < 100 || height < 100) {
      return {
        width,
        height,
        isValid: false,
        reason: 'Image too small. Minimum 100x100 pixels',
      };
    }

    if (width > 10000 || height > 10000) {
      return {
        width,
        height,
        isValid: false,
        reason: 'Image too large. Maximum 10000x10000 pixels',
      };
    }

    return {
      width,
      height,
      isValid: true,
      reason: null,
    };
  } catch (error) {
    return {
      width: 0,
      height: 0,
      isValid: false,
      reason: 'Failed to read image dimensions: ' + error.message,
    };
  }
};
