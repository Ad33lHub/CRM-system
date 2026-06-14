import mongoose from 'mongoose';
import Document from '../models/Document.model.js';
import UploadLog from '../models/UploadLog.model.js';
import AuditLog from '../models/AuditLog.model.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getFolder,
  getSignedUrl,
} from '../config/cloudinary.js';

const determineResourceType = (mimeType) => {
  if (!mimeType) return 'raw';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'video';
  return 'raw';
};

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const {
      name,
      entityType,
      entityId,
      category,
      description,
      changeNote,
      tags,
      accessLevel,
      expiresAt,
    } = req.body;

    // Validation
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (
      !entityType ||
      !['client', 'project', 'employee', 'invoice', 'proposal', 'lead'].includes(entityType)
    ) {
      return res.status(400).json({ message: 'Valid entityType is required' });
    }
    if (!entityId || !mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({ message: 'Valid entityId is required' });
    }
    if (
      !category ||
      ![
        'contract',
        'nda',
        'id_card',
        'deliverable',
        'invoice_document',
        'proposal_document',
        'certificate',
        'tax_form',
        'report',
        'other',
      ].includes(category)
    ) {
      return res.status(400).json({ message: 'Valid category is required' });
    }

    // Check if document with same name exists for this entity
    let existing = await Document.findOne({
      name,
      entityType,
      entityId: new mongoose.Types.ObjectId(entityId),
      isDeleted: false,
    });

    const folder = getFolder('documents', `${entityType}/${entityId}`);
    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').split('.')[0];
    const customPublicId = `${Date.now()}_${sanitizedName}`;
    const resourceType = determineResourceType(req.file.detectedMimeType);

    // Upload to Cloudinary with type authenticated for document security
    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      resourceType,
      publicId: customPublicId,
      type: 'authenticated',
      context: {
        uploadedBy: req.user._id.toString(),
        entityType,
        entityId: entityId.toString(),
      },
    });

    let savedDoc;
    let actionType;

    if (existing) {
      // Create new version
      const newVersionNumber = existing.currentVersion + 1;
      existing.versions.push({
        versionNumber: newVersionNumber,
        url: result.secureUrl,
        publicId: result.publicId,
        size: req.file.size,
        uploadedBy: req.user._id,
        changeNote: changeNote || `Uploaded version ${newVersionNumber}`,
        isActive: true,
      });

      // Update metadata if provided
      if (description !== undefined) existing.description = description;
      if (category !== undefined) existing.category = category;
      if (tags !== undefined) {
        existing.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
      }
      if (accessLevel !== undefined) existing.accessLevel = accessLevel;
      if (expiresAt !== undefined) existing.expiresAt = expiresAt ? new Date(expiresAt) : null;

      savedDoc = await existing.save();
      actionType = 'document.new_version_uploaded';
    } else {
      // First upload
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = Array.isArray(tags) ? tags : JSON.parse(tags);
        } catch (e) {
          if (typeof tags === 'string') {
            parsedTags = tags.split(',').map((t) => t.trim());
          }
        }
      }

      savedDoc = new Document({
        name,
        description: description || null,
        entityType,
        entityId: new mongoose.Types.ObjectId(entityId),
        category,
        tags: parsedTags,
        mimeType: req.file.detectedMimeType,
        accessLevel: accessLevel || 'team',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: req.user._id,
        currentUrl: result.secureUrl,
        currentPublicId: result.publicId,
        versions: [
          {
            versionNumber: 1,
            url: result.secureUrl,
            publicId: result.publicId,
            size: req.file.size,
            uploadedBy: req.user._id,
            changeNote: changeNote || 'Initial upload',
            isActive: true,
          },
        ],
      });

      savedDoc = await savedDoc.save();
      actionType = 'document.uploaded';
    }

    // Log to UploadLog
    await UploadLog.create({
      uploadedBy: req.user._id,
      entityType: 'document',
      entityId: savedDoc._id,
      fileName: result.publicId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      detectedMime: req.file.detectedMimeType,
      size: req.file.size,
      cloudinaryUrl: result.secureUrl,
      publicId: result.publicId,
      folder,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Log to AuditLog
    await AuditLog.create({
      action: actionType,
      entity: 'document',
      entityId: savedDoc._id,
      performedBy: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        name: savedDoc.name,
        version: savedDoc.currentVersion,
        size: req.file.size,
      },
    });

    return res.status(201).json(savedDoc);
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const query = { isDeleted: false };

    const { entityType, entityId, category, tags, expired } = req.query;

    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = new mongoose.Types.ObjectId(entityId);
    if (category) query.category = category;

    if (expired === 'true') {
      query.isExpired = true;
    } else if (expired === 'false') {
      query.isExpired = false;
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
      query.tags = { $in: tagList };
    }

    // Access level filter vs user role
    if (!['super_admin', 'admin'].includes(req.user.role)) {
      query.$or = [{ accessLevel: 'team' }, { accessLevel: 'private', createdBy: req.user._id }];
    }

    const docs = await Document.find(query).select('-versions').sort({ createdAt: -1 });
    return res.status(200).json(docs);
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Access level verification
    if (doc.accessLevel === 'admin_only' && !['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (
      doc.accessLevel === 'private' &&
      doc.createdBy.toString() !== req.user._id.toString() &&
      !['super_admin', 'admin'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.status(200).json(doc);
  } catch (error) {
    next(error);
  }
};

export const downloadDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Access level verification
    if (doc.accessLevel === 'admin_only' && !['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (
      doc.accessLevel === 'private' &&
      doc.createdBy.toString() !== req.user._id.toString() &&
      !['super_admin', 'admin'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const versionParam = req.query.version;
    let targetVersion = doc.versions.find((v) => v.isActive);

    if (versionParam) {
      const vNum = parseInt(versionParam, 10);
      targetVersion = doc.versions.find((v) => v.versionNumber === vNum);
      if (!targetVersion) {
        return res.status(404).json({ message: 'Requested version not found' });
      }
    }

    if (!targetVersion) {
      return res.status(404).json({ message: 'No active file version found' });
    }

    const resourceType = determineResourceType(doc.mimeType);
    const signedUrl = getSignedUrl(targetVersion.publicId, 3600, resourceType);

    await AuditLog.create({
      action: 'document.downloaded',
      entity: 'document',
      entityId: doc._id,
      performedBy: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        name: doc.name,
        version: targetVersion.versionNumber,
      },
    });

    return res.status(200).json({
      signedUrl,
      expiresAt: Math.round(Date.now() / 1000) + 3600,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Access checks
    if (doc.accessLevel === 'admin_only' && !['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (
      doc.createdBy.toString() !== req.user._id.toString() &&
      !['super_admin', 'admin'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete current version from Cloudinary only
    try {
      const resourceType = determineResourceType(doc.mimeType);
      await deleteFromCloudinary(doc.currentPublicId, resourceType, req.user._id);
    } catch (err) {
      // Proceed even if deletion on Cloudinary fails
    }

    // Soft delete document
    doc.isDeleted = true;
    doc.deletedAt = new Date();
    await doc.save();

    await AuditLog.create({
      action: 'document.deleted',
      entity: 'document',
      entityId: doc._id,
      performedBy: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        name: doc.name,
      },
    });

    return res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};
