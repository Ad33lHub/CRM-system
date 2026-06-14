import cloudinary from '../config/cloudinary.js';

export const uploadBuffer = (buffer, folder = 'crm') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    stream.end(buffer);
  });

export const destroyAsset = (publicId) => cloudinary.uploader.destroy(publicId);
