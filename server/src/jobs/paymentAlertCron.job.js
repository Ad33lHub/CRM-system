import cron from 'node-cron';
import Invoice from '../models/Invoice.model.js';
import { createNotification } from '../services/notification.service.js';
import { queueEmail } from '../services/email.service.js';
import { setEx, exists } from '../config/redis.js';
import logger from '../utils/logger.js';

const TZ = 'Asia/Karachi';
const DEDUP_TTL_SECONDS = 86400; // 24 hours

function dedupKey(invoiceId, stage) {
  return `payment_alert:${invoiceId}:${stage}`;
}

async function isDuped(key) {
  return (await exists(key)) === 1;
}

async function markSent(key) {
  await setEx(key, DEDUP_TTL_SECONDS, '1');
}

async function sendPaymentAlert(invoice, stage, daysOverdue) {
  const key = dedupKey(invoice._id, stage);
  if (await isDuped(key)) return;

  const client = invoice.client;
  const clientName = client?.name || 'Client';
  const clientEmail = client?.email;

  const stageLabels = { '1d': '1 day', '3d': '3 days', '7d': '7 days' };
  const stagePriorities = { '1d': 'high', '3d': 'high', '7d': 'urgent' };

  // In-app notification to invoice creator / admin
  if (invoice.createdBy) {
    await createNotification({
      recipient: invoice.createdBy,
      type: 'payment',
      title: `Invoice overdue — ${stageLabels[stage]}`,
      message: `Invoice ${invoice.invoiceNumber} for ${clientName} is ${daysOverdue} day(s) overdue.`,
      link: `/invoices/${invoice._id}`,
      groupKey: `invoice:${invoice._id}:overdue`,
      priority: stagePriorities[stage],
    });
  }

  // Email to client (if stage is escalation target)
  if (clientEmail && stage !== '1d') {
    await queueEmail({
      to: clientEmail,
      subject: `Invoice ${invoice.invoiceNumber} — Payment Overdue (${stageLabels[stage]})`,
      templateName: 'invoiceOverdue',
      templateVars: {
        clientName,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total.toLocaleString(),
        currency: invoice.currency || 'PKR',
        dueDate: new Date(invoice.dueDate).toLocaleDateString('en-PK'),
        daysOverdue: String(daysOverdue),
        payNowUrl: `${process.env.APP_URL || ''}/portal/invoices/${invoice._id}`,
        unsubscribeUrl: '',
      },
    });
  }

  // Mark invoice as escalated on the 7-day stage
  if (stage === '7d' && !invoice.escalated) {
    await Invoice.findByIdAndUpdate(invoice._id, { escalated: true });
  }

  await markSent(key);
  logger.info(`Payment alert sent: ${invoice.invoiceNumber} stage=${stage}`);
}

async function processOverdueInvoices() {
  const now = new Date();

  const overdueInvoices = await Invoice.find({
    status: { $in: ['sent', 'partially_paid', 'overdue'] },
    dueDate: { $lt: now },
  })
    .populate('client', 'name email')
    .lean();

  if (overdueInvoices.length === 0) return;
  logger.info(`Payment alert cron: ${overdueInvoices.length} overdue invoice(s)`);

  for (const invoice of overdueInvoices) {
    const msOverdue = now - new Date(invoice.dueDate);
    const daysOverdue = Math.floor(msOverdue / 86400000);

    if (daysOverdue >= 7) {
      await sendPaymentAlert(invoice, '7d', daysOverdue);
    } else if (daysOverdue >= 3) {
      await sendPaymentAlert(invoice, '3d', daysOverdue);
    } else if (daysOverdue >= 1) {
      await sendPaymentAlert(invoice, '1d', daysOverdue);
    }
  }
}

async function processPreDueReminders() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  if (dayOfWeek !== 1) return; // Monday only

  const monday = today;
  const nextFriday = new Date(today.getTime() + 4 * 86400000);

  const upcoming = await Invoice.find({
    status: { $in: ['sent', 'partially_paid'] },
    dueDate: { $gte: monday, $lte: nextFriday },
  })
    .populate('client', 'name email')
    .lean();

  if (upcoming.length === 0) return;
  logger.info(`Pre-due reminder cron (Monday): ${upcoming.length} invoice(s) due this week`);

  for (const invoice of upcoming) {
    const key = dedupKey(invoice._id, 'predue');
    if (await isDuped(key)) continue;

    const dueDate = new Date(invoice.dueDate);
    const daysUntilDue = Math.ceil((dueDate - today) / 86400000);
    const clientName = invoice.client?.name || 'Client';
    const clientEmail = invoice.client?.email;

    if (invoice.createdBy) {
      await createNotification({
        recipient: invoice.createdBy,
        type: 'payment',
        title: `Invoice due soon — ${daysUntilDue} day(s)`,
        message: `Invoice ${invoice.invoiceNumber} for ${clientName} is due on ${dueDate.toLocaleDateString('en-PK')}.`,
        link: `/invoices/${invoice._id}`,
        groupKey: `invoice:${invoice._id}:predue`,
        priority: 'normal',
      });
    }

    if (clientEmail) {
      await queueEmail({
        to: clientEmail,
        subject: `Friendly reminder: Invoice ${invoice.invoiceNumber} due ${daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`}`,
        templateName: 'invoiceSent',
        templateVars: {
          clientName,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.total.toLocaleString(),
          currency: invoice.currency || 'PKR',
          dueDate: dueDate.toLocaleDateString('en-PK'),
          invoiceUrl: `${process.env.APP_URL || ''}/portal/invoices/${invoice._id}`,
          unsubscribeUrl: '',
        },
      });
    }

    await markSent(key);
  }
}

export function startPaymentAlertCrons() {
  // Daily at 9:00 AM PKT: overdue escalation (1d / 3d / 7d stages)
  cron.schedule(
    '0 9 * * *',
    () => {
      processOverdueInvoices().catch((err) =>
        logger.error(`Overdue invoice cron error: ${err.message}`)
      );
    },
    { timezone: TZ }
  );

  // Monday at 8:00 AM PKT: pre-due reminders for invoices due this week
  cron.schedule(
    '0 8 * * 1',
    () => {
      processPreDueReminders().catch((err) =>
        logger.error(`Pre-due reminder cron error: ${err.message}`)
      );
    },
    { timezone: TZ }
  );

  logger.info('Payment alert crons started (2 schedules)');
}
