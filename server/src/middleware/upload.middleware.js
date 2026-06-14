import multer from 'multer';

export const UPLOAD_LIMITS = {
  default: 10 * 1024 * 1024,
  profileImage: 2 * 1024 * 1024,
  document: 10 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  chatFile: 5 * 1024 * 1024,
  paymentProof: 5 * 1024 * 1024,
};

const handleMulterError = (err, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected field name' });
    }
    return res.status(400).json({ message: err.message });
  }
  return next(err);
};

export const uploadSingle = (fieldName, limitKey = 'default') => {
  const limit = UPLOAD_LIMITS[limitKey] || UPLOAD_LIMITS.default;
  const limitMB = limit / (1024 * 1024);

  return (req, res, next) => {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: limit },
    }).single(fieldName);

    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: `File too large. Maximum: ${limitMB}MB` });
        }
        return handleMulterError(err, res, next);
      }
      next();
    });
  };
};

export const uploadMultiple = (fieldName, maxCount = 10, limitKey = 'default') => {
  const limit = UPLOAD_LIMITS[limitKey] || UPLOAD_LIMITS.default;
  const limitMB = limit / (1024 * 1024);

  return (req, res, next) => {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: limit, files: maxCount },
    }).array(fieldName, maxCount);

    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: `File too large. Maximum: ${limitMB}MB` });
        }
        return handleMulterError(err, res, next);
      }
      next();
    });
  };
};

export const uploadFields = (fields, limitKey = 'default') => {
  const limit = UPLOAD_LIMITS[limitKey] || UPLOAD_LIMITS.default;
  const limitMB = limit / (1024 * 1024);

  return (req, res, next) => {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: limit },
    }).fields(fields);

    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: `File too large. Maximum: ${limitMB}MB` });
        }
        return handleMulterError(err, res, next);
      }
      next();
    });
  };
};

export default { uploadSingle, uploadMultiple, uploadFields };
