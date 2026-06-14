import cron from 'node-cron';
import Reminder from '../models/Reminder.model.js';
import { addJob, QUEUE_NAMES } from '../services/queue.service.js';
import logger from '../utils/logger.js';

const TZ = 'Asia/Karachi';

async function queueDueReminders() {
  const now = new Date();
  const reminders = await Reminder.find({
    isCompleted: false,
    dueAt: { $lte: now },
    $or: [{ isSnoozed: false }, { snoozeUntil: { $lte: now } }],
  }).lean();

  if (reminders.length === 0) return;

  logger.info(`Reminder cron: ${reminders.length} due reminder(s) to process`);

  await Promise.allSettled(
    reminders.map((r) =>
      addJob(QUEUE_NAMES.REMINDER, 'process-reminder', { reminderId: r._id.toString() })
    )
  );
}

async function queueStaleLeadReminders() {
  try {
    const { default: Lead } = await import('../models/Lead.model.js');
    const staleThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const staleLeads = await Lead.find({
      status: { $nin: ['won', 'lost'] },
      updatedAt: { $lte: staleThreshold },
    })
      .select('_id assignedTo title')
      .lean();

    if (staleLeads.length === 0) return;
    logger.info(`Lead followup cron: ${staleLeads.length} stale lead(s)`);

    await Promise.allSettled(
      staleLeads.map((lead) =>
        addJob(QUEUE_NAMES.REMINDER, 'stale-lead', {
          leadId: lead._id.toString(),
          assignedTo: lead.assignedTo?.toString(),
          title: lead.title,
        })
      )
    );
  } catch (err) {
    logger.error(`Stale lead cron error: ${err.message}`);
  }
}

async function queueDeadlineAlerts() {
  try {
    const { default: Task } = await import('../models/Task.model.js');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const dueSoonTasks = await Task.find({
      status: { $nin: ['done', 'cancelled'] },
      dueDate: { $gte: tomorrow, $lte: dayAfter },
    })
      .select('_id assignedTo title dueDate')
      .lean();

    if (dueSoonTasks.length === 0) return;
    logger.info(`Deadline alert cron: ${dueSoonTasks.length} task(s) due soon`);

    await Promise.allSettled(
      dueSoonTasks.map((task) =>
        addJob(QUEUE_NAMES.REMINDER, 'deadline-alert', {
          taskId: task._id.toString(),
          assignedTo: task.assignedTo?.toString(),
          title: task.title,
          dueDate: task.dueDate,
        })
      )
    );
  } catch (err) {
    logger.error(`Deadline alert cron error: ${err.message}`);
  }
}

async function queueContractRenewalReminders() {
  try {
    const { default: Project } = await import('../models/Project.model.js');
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiring = await Project.find({
      status: 'active',
      endDate: { $lte: in30Days, $gte: new Date() },
    })
      .select('_id name manager client endDate')
      .lean();

    if (expiring.length === 0) return;
    logger.info(`Contract renewal cron: ${expiring.length} project(s) expiring within 30 days`);

    await Promise.allSettled(
      expiring.map((project) =>
        addJob(QUEUE_NAMES.REMINDER, 'contract-renewal', {
          projectId: project._id.toString(),
          managerId: project.manager?.toString(),
          projectName: project.name,
          endDate: project.endDate,
        })
      )
    );
  } catch (err) {
    logger.error(`Contract renewal cron error: ${err.message}`);
  }
}

export function startReminderCrons() {
  // Every 5 minutes: check due reminders
  cron.schedule(
    '*/5 * * * *',
    () => {
      queueDueReminders().catch((err) => logger.error(`Due reminders cron: ${err.message}`));
    },
    { timezone: TZ }
  );

  // 8:00 AM PKT daily: stale lead follow-up nudges
  cron.schedule(
    '0 8 * * *',
    () => {
      queueStaleLeadReminders().catch((err) => logger.error(`Stale lead cron: ${err.message}`));
    },
    { timezone: TZ }
  );

  // 9:00 AM PKT daily: upcoming task deadline alerts
  cron.schedule(
    '0 9 * * *',
    () => {
      queueDeadlineAlerts().catch((err) => logger.error(`Deadline alert cron: ${err.message}`));
    },
    { timezone: TZ }
  );

  // 1st of every month at 8:00 AM PKT: contract renewal alerts
  cron.schedule(
    '0 8 1 * *',
    () => {
      queueContractRenewalReminders().catch((err) =>
        logger.error(`Contract renewal cron: ${err.message}`)
      );
    },
    { timezone: TZ }
  );

  logger.info('Reminder crons started (4 schedules)');
}
