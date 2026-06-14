import { Worker } from 'bullmq';
import redisConnection from '../config/redis.js';
import { QUEUE_NAMES } from '../services/queue.service.js';
import { createNotification } from '../services/notification.service.js';
import { queueEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';

async function handleProcessReminder(data) {
  const { default: Reminder } = await import('../models/Reminder.model.js');
  const reminder = await Reminder.findById(data.reminderId);
  if (!reminder || reminder.isCompleted) return;

  // In-app notification
  if (reminder.channels.includes('in_app')) {
    await createNotification({
      recipient: reminder.owner,
      type: 'reminder',
      title: reminder.title,
      message: reminder.message || `Reminder: ${reminder.title}`,
      link: reminder.entityId
        ? `/${reminder.entityType?.toLowerCase()}s/${reminder.entityId}`
        : null,
      groupKey: `reminder:${reminder._id}`,
      priority: 'high',
    });
  }

  // Email channel
  if (reminder.channels.includes('email')) {
    const { default: User } = await import('../models/User.model.js');
    const user = await User.findById(reminder.owner).select('email name').lean();
    if (user?.email) {
      await queueEmail({
        to: user.email,
        subject: `Reminder: ${reminder.title}`,
        templateName: 'deadlineAlert',
        templateVars: {
          recipientName: user.name,
          entityName: reminder.title,
          entityType: reminder.entityType || 'Reminder',
          dueDate: reminder.dueAt.toLocaleDateString('en-PK'),
          daysUntilDue: '0',
          entityUrl: `${process.env.APP_URL || ''}`,
          unsubscribeUrl: '',
        },
      });
    }
  }

  // Handle repeat logic
  if (
    reminder.repeatRule !== 'none' &&
    (reminder.maxRepeats === 0 || reminder.repeatCount < reminder.maxRepeats)
  ) {
    const INTERVALS = { daily: 86400000, weekly: 604800000, monthly: 30 * 86400000 };
    reminder.dueAt = new Date(reminder.dueAt.getTime() + INTERVALS[reminder.repeatRule]);
    reminder.repeatCount += 1;
    reminder.isSnoozed = false;
    reminder.snoozeUntil = null;
    await reminder.save();
  } else {
    reminder.isCompleted = true;
    await reminder.save();
  }
}

async function handleStaleLeadJob(data) {
  if (!data.assignedTo) return;
  await createNotification({
    recipient: data.assignedTo,
    type: 'lead',
    title: 'Lead needs follow-up',
    message: `"${data.title}" has had no activity in 7+ days.`,
    link: `/leads/${data.leadId}`,
    groupKey: `lead:${data.leadId}:stale`,
    priority: 'normal',
  });
}

async function handleDeadlineAlertJob(data) {
  if (!data.assignedTo) return;
  const dueDate = new Date(data.dueDate);
  const msLeft = dueDate - Date.now();
  const daysLeft = Math.ceil(msLeft / 86400000);

  await createNotification({
    recipient: data.assignedTo,
    type: 'deadline',
    title: 'Task deadline approaching',
    message: `"${data.title}" is due in ${daysLeft} day(s).`,
    link: `/tasks/${data.taskId}`,
    groupKey: `task:${data.taskId}:deadline`,
    priority: daysLeft <= 1 ? 'urgent' : 'high',
  });
}

async function handleContractRenewalJob(data) {
  if (!data.managerId) return;
  const endDate = new Date(data.endDate);
  const daysLeft = Math.ceil((endDate - Date.now()) / 86400000);

  await createNotification({
    recipient: data.managerId,
    type: 'project',
    title: 'Contract expiring soon',
    message: `Project "${data.projectName}" ends in ${daysLeft} day(s).`,
    link: `/projects/${data.projectId}`,
    groupKey: `project:${data.projectId}:renewal`,
    priority: 'high',
  });
}

export const reminderWorker = new Worker(
  QUEUE_NAMES.REMINDER,
  async (job) => {
    switch (job.name) {
      case 'process-reminder':
        await handleProcessReminder(job.data);
        break;
      case 'stale-lead':
        await handleStaleLeadJob(job.data);
        break;
      case 'deadline-alert':
        await handleDeadlineAlertJob(job.data);
        break;
      case 'contract-renewal':
        await handleContractRenewalJob(job.data);
        break;
      default:
        logger.warn(`Unknown reminder job type: ${job.name}`);
    }
  },
  { connection: redisConnection, concurrency: 3 }
);

reminderWorker.on('completed', (job) =>
  logger.info(`Reminder job completed: ${job.name} (${job.id})`)
);

reminderWorker.on('failed', async (job, err) => {
  logger.error(`Reminder job failed: ${job?.name} (${job?.id}) — ${err.message}`);

  if (job?.name === 'process-reminder' && job.data?.reminderId) {
    try {
      const { default: Reminder } = await import('../models/Reminder.model.js');
      await Reminder.findByIdAndUpdate(job.data.reminderId, { $inc: { failCount: 1 } });
    } catch (updateErr) {
      logger.error(`Failed to increment reminder failCount: ${updateErr.message}`);
    }
  }
});

export default reminderWorker;
