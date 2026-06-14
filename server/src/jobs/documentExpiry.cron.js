import cron from 'node-cron';
import mongoose from 'mongoose';
import Document from '../models/Document.model.js';
import User from '../models/User.model.js';
import { createNotification, notifyMultiple } from '../services/notification.service.js';
import logger from '../utils/logger.js';

export const checkDocumentExpirations = async () => {
  logger.info('Running document expiry check...');

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  // 1. Find documents expiring soon
  // expiresAt < today + 30 days && expiresAt >= today && isExpired: false && isDeleted: false
  const expiringSoonDocs = await Document.find({
    expiresAt: { $lt: thirtyDaysFromNow, $gte: today },
    isExpired: false,
    isDeleted: false,
  });

  for (const doc of expiringSoonDocs) {
    logger.info(`Document expiring soon: ${doc.name}`);

    // Notification payload
    const payload = {
      type: 'document_expiry',
      title: 'Document Expiring Soon',
      message: `Document '${doc.name}' expires on ${doc.expiresAt.toLocaleDateString()}`,
      link: `/documents/${doc._id}`,
      metadata: { documentId: doc._id.toString() },
    };

    // Notify document creator
    if (doc.createdBy) {
      await createNotification({ ...payload, recipient: doc.createdBy });
    }

    // Notify entity owner/manager (check project, client, invoice, etc.)
    try {
      const modelName = doc.entityType.charAt(0).toUpperCase() + doc.entityType.slice(1);
      const Model = mongoose.model(modelName === 'Profile' ? 'User' : modelName);
      const entity = await Model.findById(doc.entityId);
      if (entity) {
        if (entity.createdBy && entity.createdBy.toString() !== doc.createdBy?.toString()) {
          await createNotification({ ...payload, recipient: entity.createdBy });
        }
        if (entity.user && entity.user.toString() !== doc.createdBy?.toString()) {
          await createNotification({ ...payload, recipient: entity.user });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. Find documents already expired
  // expiresAt < today && isExpired: false && isDeleted: false
  const expiredDocs = await Document.find({
    expiresAt: { $lt: today },
    isExpired: false,
    isDeleted: false,
  });

  if (expiredDocs.length > 0) {
    const admins = await User.find({ role: { $in: ['super_admin', 'admin'] } });
    const adminIds = admins.map((a) => a._id);

    for (const doc of expiredDocs) {
      logger.info(`Document expired: ${doc.name}`);
      doc.isExpired = true;
      await doc.save();

      const payload = {
        type: 'document_expired',
        title: 'Document Expired',
        message: `Document '${doc.name}' has expired`,
        link: `/documents/${doc._id}`,
        metadata: { documentId: doc._id.toString() },
      };

      // Notify admins and document creator
      const recipients = new Set(adminIds.map((id) => id.toString()));
      if (doc.createdBy) {
        recipients.add(doc.createdBy.toString());
      }

      await notifyMultiple(Array.from(recipients), payload);
    }
  }
};

// Schedule the cron job to run daily at 8:00 AM PKT
export const initDocumentExpiryCron = () => {
  cron.schedule(
    '0 8 * * *',
    async () => {
      try {
        await checkDocumentExpirations();
      } catch (error) {
        logger.error('Error in document expiry cron job: ' + error.message);
      }
    },
    {
      timezone: 'Asia/Karachi',
    }
  );
  logger.info('Document expiry cron job initialized.');
};
