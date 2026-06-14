import { fileTypeFromBuffer } from 'file-type';

export const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
  audio: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3'],
  archives: ['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed'],
};

export const validateFileType = (allowedCategories) => {
  return async (req, res, next) => {
    try {
      const filesToValidate = [];
      if (req.file) {
        filesToValidate.push(req.file);
      }
      if (req.files) {
        if (Array.isArray(req.files)) {
          filesToValidate.push(...req.files);
        } else {
          Object.values(req.files).forEach((fieldFiles) => {
            filesToValidate.push(...fieldFiles);
          });
        }
      }

      if (filesToValidate.length === 0) {
        return next();
      }

      const allowedMimes = allowedCategories.reduce((acc, cat) => {
        const mimes = ALLOWED_TYPES[cat];
        if (mimes) {
          return acc.concat(mimes);
        }
        return acc;
      }, []);

      for (const file of filesToValidate) {
        let detectedMime = null;
        const detected = await fileTypeFromBuffer(file.buffer);
        if (detected) {
          detectedMime = detected.mime;
        } else {
          // Plain text / CSV / SVG fallback
          const text = file.buffer.toString('utf8', 0, Math.min(file.buffer.length, 512));
          if (
            file.originalname?.endsWith('.svg') &&
            (text.includes('<svg') || text.includes('<?xml'))
          ) {
            detectedMime = 'image/svg+xml';
          } else if (
            file.originalname?.endsWith('.txt') &&
            !file.buffer.slice(0, 512).includes(0)
          ) {
            detectedMime = 'text/plain';
          } else if (
            file.originalname?.endsWith('.csv') &&
            !file.buffer.slice(0, 512).includes(0)
          ) {
            detectedMime = 'text/csv';
          }
        }

        if (!detectedMime) {
          return res.status(400).json({ message: 'Cannot determine file type' });
        }

        if (!allowedMimes.includes(detectedMime)) {
          const isExecutableExt =
            file.originalname?.endsWith('.exe') ||
            file.originalname?.endsWith('.dll') ||
            file.originalname?.endsWith('.bat') ||
            file.originalname?.endsWith('.sh');
          if (isExecutableExt) {
            try {
              const AuditLog = (await import('../models/AuditLog.model.js')).default;
              const mongoose = (await import('mongoose')).default;
              await AuditLog.create({
                action: 'file.security_scan_failed',
                entity: req.body.entityType || 'other',
                entityId: mongoose.Types.ObjectId.isValid(req.body.entityId)
                  ? new mongoose.Types.ObjectId(req.body.entityId)
                  : null,
                performedBy: req.user?._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                metadata: {
                  fileName: file.originalname,
                  size: file.size,
                },
              });
            } catch (auditErr) {
              // ignore
            }
            return res.status(400).json({ message: 'File failed security scan' });
          }
          return res.status(400).json({
            message: `File type ${detectedMime} not allowed. Allowed types: ${allowedMimes.join(', ')}`,
          });
        }

        file.detectedMimeType = detectedMime;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const scanForThreats = async (buffer) => {
  // TODO: Replace with ClamAV integration for full virus scanning in production
  if (!buffer || buffer.length < 2) return;

  // Check PE header: MZ signature (Windows executables)
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    throw new Error('File failed security scan');
  }

  // Check ELF header: 7f 45 4c 46 (Linux executables)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x7f &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x4c &&
    buffer[3] === 0x46
  ) {
    throw new Error('File failed security scan');
  }

  // Check for Script tags: <script in binary content
  const content = buffer.toString('utf8').toLowerCase();
  if (content.includes('<script')) {
    throw new Error('File failed security scan');
  }
};
