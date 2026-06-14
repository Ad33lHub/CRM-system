import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import redisConnection from '../config/redis.js';
import { QUEUE_NAMES } from '../services/queue.service.js';
import { sendEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';

const FAIL_THRESHOLD = 3;

const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000000');

async function logEmailAudit(job, status, error = null) {
  try {
    const { default: AuditLog } = await import('../models/AuditLog.model.js');
    await AuditLog.create({
      action: `email.${status}`,
      entity: 'Email',
      entityId: SYSTEM_USER_ID,
      performedBy: SYSTEM_USER_ID,
      metadata: {
        jobId: job.id,
        jobName: job.name,
        to: job.data?.to,
        subject: job.data?.subject,
        attemptsMade: job.attemptsMade,
        error: error?.message || null,
      },
    });
  } catch (auditErr) {
    logger.warn(`AuditLog write failed for email job ${job.id}: ${auditErr.message}`);
  }
}

async function notifyAdminOfRepeatedFailure(job, err) {
  try {
    const { queueEmail } = await import('../services/email.service.js');
    const { default: config } = await import('../config/env.js');
    const adminEmail = config.ADMIN_EMAIL;
    if (!adminEmail) return;

    await queueEmail({
      to: adminEmail,
      subject: `[Alert] Email delivery failing repeatedly — job ${job.id}`,
      html: `<p>Email job <strong>${job.id}</strong> (${job.name}) has failed ${FAIL_THRESHOLD} times.</p>
             <p>Recipient: ${job.data?.to}</p>
             <p>Subject: ${job.data?.subject}</p>
             <p>Last error: ${err.message}</p>`,
    });
  } catch (alertErr) {
    logger.error(`Failed to send admin alert for job ${job.id}: ${alertErr.message}`);
  }
}

export const emailWorker = new Worker(
  QUEUE_NAMES.EMAIL,
  async (job) => {
    const { to, subject, html } = job.data;
    if (!to || !html) {
      throw new Error(`Invalid email job data: missing to or html (job ${job.id})`);
    }
    await sendEmail({ to, subject, html });
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

emailWorker.on('completed', async (job) => {
  logger.info(`Email job completed: ${job.id} → ${job.data?.to}`);
  await logEmailAudit(job, 'sent');
});

emailWorker.on('failed', async (job, err) => {
  logger.error(`Email job failed: ${job?.id} attempt ${job?.attemptsMade} — ${err.message}`);
  await logEmailAudit(job, 'failed', err);

  if (job && job.attemptsMade >= FAIL_THRESHOLD) {
    await notifyAdminOfRepeatedFailure(job, err);
  }
});

export default emailWorker;
