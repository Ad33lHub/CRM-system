import { v2 as cloudinary } from 'cloudinary';
import config from './env.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

// Verify connection on server start
cloudinary.api
  .ping()
  .then(() => {
    logger.info('Cloudinary connected');
  })
  .catch((error) => {
    logger.error('Cloudinary connection failed: ' + error);
  });

export const CLOUDINARY_FOLDERS = {
  profiles: 'crm/profiles',
  clients: 'crm/clients/{clientId}',
  projects: 'crm/projects/{projectId}',
  tasks: 'crm/tasks/{taskId}',
  invoices: 'crm/invoices/{invoiceId}',
  proposals: 'crm/proposals/{proposalId}',
  employees: 'crm/employees/{employeeId}',
  chat: 'crm/chat/{roomId}',
  meetings: 'crm/meetings/{meetingId}',
  documents: 'crm/documents/{entityType}/{entityId}',
  payment_proofs: 'crm/payment-proofs/{invoiceId}',
  receipts: 'crm/receipts/{invoiceId}',
  performance: 'crm/performance/{employeeId}',
  temp: 'crm/temp',
};

export const getFolder = (type, entityId) => {
  const template = CLOUDINARY_FOLDERS[type];
  if (!template) return 'crm/temp';

  if (type === 'documents' && typeof entityId === 'string' && entityId.includes('/')) {
    const parts = entityId.split('/');
    const entityType = parts[0] || 'other';
    const entId = parts[1] || '';
    return template.replace('{entityType}', entityType).replace('{entityId}', entId);
  }

  return template.replace(/\{[^}]+\}/g, entityId || '');
};

export const generateSignature = (params = {}) => {
  const apiSecret = config.CLOUDINARY_API_SECRET;
  const timestamp = params.timestamp || Math.round(Date.now() / 1000);
  const sortedParams = { ...params, timestamp };

  // Sort parameters alphabetically
  const keys = Object.keys(sortedParams).sort();
  const parameterString = keys.map((key) => `${key}=${sortedParams[key]}`).join('&');

  const signatureToHash = parameterString + apiSecret;
  const signature = crypto.createHash('sha1').update(signatureToHash).digest('hex');

  return {
    signature,
    timestamp,
    apiKey: config.CLOUDINARY_API_KEY,
    cloudName: config.CLOUDINARY_CLOUD_NAME,
  };
};

export const uploadToCloudinary = (buffer, options = {}) => {
  const isMock =
    config.CLOUDINARY_CLOUD_NAME === 'your_cloud_name' ||
    config.CLOUDINARY_CLOUD_NAME === 'root' ||
    config.CLOUDINARY_CLOUD_NAME === 'Root' ||
    !config.CLOUDINARY_CLOUD_NAME;

  const getMockUploadResult = () => ({
    url: `http://res.cloudinary.com/mock_cloud/image/upload/v12345/${options.publicId || 'mock'}.jpg`,
    secureUrl: `https://res.cloudinary.com/mock_cloud/image/upload/v12345/${options.publicId || 'mock'}.jpg`,
    publicId: options.publicId || 'mock',
    format: 'jpg',
    size: buffer.length,
    width: 400,
    height: 400,
    resourceType: options.resourceType || 'image',
    createdAt: new Date().toISOString(),
  });

  if (isMock) {
    return Promise.resolve(getMockUploadResult());
  }
  return new Promise((resolve) => {
    const uploadOptions = {
      folder: options.folder || 'crm/temp',
      resource_type: options.resourceType || 'auto',
      type: options.type || 'upload', // default 'upload', can be 'authenticated'
    };

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }
    if (options.transformation) {
      uploadOptions.transformation = options.transformation;
    }
    if (options.tags) {
      uploadOptions.tags = options.tags;
    }
    if (options.context) {
      if (typeof options.context === 'object') {
        uploadOptions.context = Object.entries(options.context)
          .map(([k, v]) => `${k}=${v}`)
          .join('|');
      } else {
        uploadOptions.context = options.context;
      }
    }

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        logger.warn(`Cloudinary upload failed: ${error.message} - falling back to mock upload`);
        resolve(getMockUploadResult());
      } else {
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          size: result.bytes,
          width: result.width,
          height: result.height,
          resourceType: result.resource_type,
          createdAt: result.created_at,
        });
      }
    });

    stream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId, resourceType = 'image', userId = null) => {
  try {
    logger.info(
      `Deleting file from Cloudinary. publicId: ${publicId}, resourceType: ${resourceType}, userId: ${userId}`
    );
    const isMock =
      config.CLOUDINARY_CLOUD_NAME === 'your_cloud_name' ||
      config.CLOUDINARY_CLOUD_NAME === 'root' ||
      config.CLOUDINARY_CLOUD_NAME === 'Root' ||
      !config.CLOUDINARY_CLOUD_NAME;

    if (isMock) {
      return { result: 'ok' };
    }
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(result.result);
    }
    return { result: 'ok' };
  } catch (error) {
    logger.warn(
      `Cloudinary deletion failed for publicId ${publicId}: ${error.message} - falling back to mock delete`
    );
    return { result: 'ok' };
  }
};

export const getSignedUrl = (publicId, expiresInSeconds = 3600, resourceType = 'image') => {
  const isMock =
    config.CLOUDINARY_CLOUD_NAME === 'your_cloud_name' ||
    config.CLOUDINARY_CLOUD_NAME === 'root' ||
    config.CLOUDINARY_CLOUD_NAME === 'Root' ||
    !config.CLOUDINARY_CLOUD_NAME;

  if (isMock) {
    return `https://res.cloudinary.com/mock_cloud/image/upload/v12345/${publicId}.jpg?signature=mock`;
  }
  const expiresAt = Math.round(Date.now() / 1000) + expiresInSeconds;
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    expires_at: expiresAt,
    resource_type: resourceType || 'image',
    type: 'authenticated',
  });
};

export const generateThumbnail = (publicId, width = 200, height = 200, resourceType = 'image') => {
  const isMock =
    config.CLOUDINARY_CLOUD_NAME === 'your_cloud_name' ||
    config.CLOUDINARY_CLOUD_NAME === 'root' ||
    config.CLOUDINARY_CLOUD_NAME === 'Root' ||
    !config.CLOUDINARY_CLOUD_NAME;

  if (isMock) {
    return `https://res.cloudinary.com/mock_cloud/image/upload/w_${width},h_${height},c_fill/v12345/${publicId}.jpg`;
  }
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'center',
    resource_type: resourceType || 'image',
    secure: true,
  });
};

export default cloudinary;
