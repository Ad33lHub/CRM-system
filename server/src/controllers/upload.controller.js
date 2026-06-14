import mongoose from 'mongoose';
import UploadLog from '../models/UploadLog.model.js';
import AuditLog from '../models/AuditLog.model.js';
import User from '../models/User.model.js';
import Employee from '../models/Employee.model.js';
import { uploadToCloudinary, deleteFromCloudinary, getFolder } from '../config/cloudinary.js';
import { scanForThreats } from '../middleware/fileValidation.middleware.js';
import {
  validateImageDimensions,
  processProfileImage,
} from '../services/imageProcessor.service.js';

// Helper to check if model exists dynamically
const getModel = (name) => {
  try {
    return mongoose.model(name);
  } catch (e) {
    return null;
  }
};

// Access validation helper
const hasEntityAccess = async (user, entityType, entityId) => {
  if (['super_admin', 'admin'].includes(user.role)) return true;

  // 1. Profile: Check if user is own profile
  if (entityType === 'profile') {
    if (user.role === 'manager') return true;
    return entityId.toString() === user._id.toString();
  }

  // 2. Project
  if (entityType === 'project') {
    const ProjectModel = getModel('Project');
    if (!ProjectModel) return true; // fallback if model doesn't exist
    const project = await ProjectModel.findById(entityId);
    if (!project) return false;
    if (user.role === 'manager') return true;
    if (user.role === 'client' && project.client?.toString() === user.clientId?.toString())
      return true;
    return project.team.some((m) => m.user.toString() === user._id.toString());
  }

  // 3. Employee
  if (entityType === 'employee') {
    const EmployeeModel = getModel('Employee');
    if (!EmployeeModel) return true;
    const employee = await EmployeeModel.findById(entityId);
    if (!employee) return false;
    if (user.role === 'manager') return true;
    return employee.user.toString() === user._id.toString();
  }

  // 4. Client
  if (entityType === 'client') {
    const ClientModel = getModel('Client');
    if (!ClientModel) return true;
    const client = await ClientModel.findById(entityId);
    if (!client) return false;
    if (['manager', 'developer', 'designer', 'qa_engineer'].includes(user.role)) return true;
    return user.role === 'client' && client._id.toString() === user.clientId?.toString();
  }

  // 5. Task
  if (entityType === 'task') {
    const TaskModel = getModel('Task');
    if (!TaskModel) return true;
    const task = await TaskModel.findById(entityId);
    if (!task) return false;
    if (user.role === 'manager') return true;
    const ProjectModel = getModel('Project');
    if (!ProjectModel) return true;
    const project = await ProjectModel.findById(task.project);
    if (!project) return false;
    if (user.role === 'client' && project.client?.toString() === user.clientId?.toString())
      return true;
    return project.team.some((m) => m.user.toString() === user._id.toString());
  }

  // 6. Invoice / Payment Proof / Receipt
  if (['invoice', 'payment_proof', 'receipt'].includes(entityType)) {
    const InvoiceModel = getModel('Invoice');
    if (!InvoiceModel) return true;
    const invoice = await InvoiceModel.findById(entityId);
    if (!invoice) return false;
    if (['manager', 'developer', 'designer', 'qa_engineer'].includes(user.role)) return true;
    return user.role === 'client' && invoice.client?.toString() === user.clientId?.toString();
  }

  // Fallback for proposal, chat, meeting etc.
  if (user.role === 'manager') return true;
  return true;
};

const determineResourceType = (mimeType) => {
  if (!mimeType) return 'raw';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'video'; // Cloudinary handles audio as video
  return 'raw';
};

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { entityType, entityId } = req.body;

    if (!entityType) {
      return res.status(400).json({ message: 'entityType is required' });
    }
    if (!entityId || !mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({ message: 'Valid entityId is required' });
    }

    // Access check
    const hasAccess = await hasEntityAccess(req.user, entityType, entityId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this entity' });
    }

    // Security scan
    try {
      await scanForThreats(req.file.buffer);
    } catch (err) {
      await AuditLog.create({
        action: 'file.security_scan_failed',
        entity: entityType,
        entityId: new mongoose.Types.ObjectId(entityId),
        performedBy: req.user._id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          fileName: req.file.originalname,
          size: req.file.size,
        },
      });
      return res.status(400).json({ message: 'File failed security scan' });
    }

    const folder = getFolder(entityType, entityId);
    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').split('.')[0];
    const customPublicId = `${Date.now()}_${sanitizedName}`;
    const resourceType = determineResourceType(req.file.detectedMimeType);

    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      resourceType,
      publicId: customPublicId,
      type: ['payment_proof', 'employee', 'document', 'proposal', 'invoice'].includes(entityType)
        ? 'authenticated'
        : 'upload',
      context: {
        uploadedBy: req.user._id.toString(),
        entityType,
        entityId: entityId.toString(),
      },
    });

    const log = await UploadLog.create({
      uploadedBy: req.user._id,
      entityType,
      entityId: new mongoose.Types.ObjectId(entityId),
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

    await AuditLog.create({
      action: 'file.uploaded',
      entity: entityType,
      entityId: new mongoose.Types.ObjectId(entityId),
      performedBy: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        fileName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.detectedMimeType,
      },
    });

    return res.status(201).json({
      url: result.secureUrl,
      publicId: result.publicId,
      fileName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.detectedMimeType,
      folder,
      uploadLogId: log._id,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const { publicId } = req.params;

    // Express wildcard parameter can match leading slash or other characters depending on match
    const cleanPublicId = decodeURIComponent(publicId);

    const log = await UploadLog.findOne({ publicId: cleanPublicId, isDeleted: false });
    if (!log) {
      return res.status(404).json({ message: 'Upload log not found' });
    }

    // Access check: uploader === req.user OR admin role
    if (
      log.uploadedBy.toString() !== req.user._id.toString() &&
      !['super_admin', 'admin'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const resourceType = determineResourceType(log.detectedMime);
    await deleteFromCloudinary(log.publicId, resourceType, req.user._id);

    log.isDeleted = true;
    log.deletedAt = new Date();
    log.deletedBy = req.user._id;
    await log.save();

    // Remove reference from parent entity
    const parentModel = getModel(
      log.entityType === 'profile'
        ? 'User'
        : log.entityType.charAt(0).toUpperCase() + log.entityType.slice(1)
    );
    if (parentModel) {
      const parentDoc = await parentModel.findById(log.entityId);
      if (parentDoc) {
        if (parentDoc.avatarPublicId === log.publicId) {
          parentDoc.avatar = null;
          parentDoc.avatarPublicId = null;
          await parentDoc.save();
        } else if (parentDoc.fileUrl === log.cloudinaryUrl || parentDoc.publicId === log.publicId) {
          parentDoc.fileUrl = null;
          parentDoc.publicId = null;
          await parentDoc.save();
        } else if (parentDoc.documents && Array.isArray(parentDoc.documents)) {
          parentDoc.documents = parentDoc.documents.filter((doc) => doc.publicId !== log.publicId);
          await parentDoc.save();
        }
      }
    }

    await AuditLog.create({
      action: 'file.deleted',
      entity: log.entityType,
      entityId: log.entityId,
      performedBy: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        fileName: log.originalName,
        publicId: log.publicId,
      },
    });

    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getUploads = async (req, res, next) => {
  try {
    const filter = { isDeleted: false };

    if (!['super_admin', 'admin'].includes(req.user.role)) {
      filter.uploadedBy = req.user._id;
    }

    const { entityType, entityId } = req.query;
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = new mongoose.Types.ObjectId(entityId);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      UploadLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      UploadLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(req.file.detectedMimeType)) {
      return res.status(400).json({ message: 'GIF and SVG are not allowed for profile images' });
    }

    const dim = await validateImageDimensions(req.file.buffer);
    if (!dim.isValid) {
      return res.status(400).json({ message: dim.reason });
    }

    let targetUserId = req.user._id;
    let targetEmployee = null;

    if (req.body.employeeId) {
      if (!['super_admin', 'admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied to manage employee profiles' });
      }
      targetEmployee = await Employee.findById(req.body.employeeId);
      if (!targetEmployee) {
        return res.status(404).json({ message: 'Employee profile not found' });
      }
      targetUserId = targetEmployee.user;
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Process image with Sharp
    const processedBuffer = await processProfileImage(req.file.buffer);

    // Delete old avatar
    if (targetUser.avatarPublicId) {
      try {
        await deleteFromCloudinary(targetUser.avatarPublicId, 'image', req.user._id);
      } catch (err) {
        // Do not fail if delete fails (e.g. not found)
      }
    }

    const folder = getFolder('profiles', targetUserId.toString());
    const publicId = `avatar_${targetUserId}_${Date.now()}`;

    const result = await uploadToCloudinary(processedBuffer, {
      folder,
      publicId,
      resourceType: 'image',
      type: 'upload', // profiles are public
    });

    targetUser.avatar = result.secureUrl;
    targetUser.avatarPublicId = result.publicId;
    await targetUser.save();

    await UploadLog.create({
      uploadedBy: req.user._id,
      entityType: 'profile',
      entityId: targetUserId,
      fileName: result.publicId,
      originalName: req.file.originalname,
      mimeType: 'image/webp',
      detectedMime: 'image/webp',
      size: processedBuffer.length,
      cloudinaryUrl: result.secureUrl,
      publicId: result.publicId,
      folder,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await AuditLog.create({
      action: 'profile.avatar_uploaded',
      entity: 'user',
      entityId: targetUserId,
      performedBy: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        publicId: result.publicId,
        size: processedBuffer.length,
      },
    });

    return res.status(200).json({
      avatarUrl: result.secureUrl,
      publicId: result.publicId,
      size: processedBuffer.length,
      dimensions: '400x400',
    });
  } catch (error) {
    next(error);
  }
};
