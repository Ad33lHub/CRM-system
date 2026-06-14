import nodemailer from 'nodemailer';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { addJob, QUEUE_NAMES } from './queue.service.js';
import { compileTemplate } from './compileTemplate.js';

// Connection-pooled transporter — created once, reused by the worker.
export const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

/**
 * Directly sends an email via SMTP.
 * Called ONLY by the BullMQ email worker — never called inline from controllers.
 */
export async function sendEmail({ to, subject, html }) {
  const info = await transporter.sendMail({
    from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_ADDRESS}>`,
    to,
    subject,
    html,
  });
  logger.info(`Email sent to <${to}> msgId=${info.messageId}`);
  return info;
}

/**
 * Queues an email job via BullMQ.
 * Use this from controllers/services — never call sendEmail() directly.
 *
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} [opts.templateName] - MJML template name (without .mjml)
 * @param {Object} [opts.templateVars]  - Variables to inject into the template
 * @param {string} [opts.html]          - Pre-built HTML (skip template compilation)
 */
export async function queueEmail({ to, subject, templateName, templateVars = {}, html }) {
  try {
    let resolvedHtml = html;

    if (!resolvedHtml && templateName) {
      resolvedHtml = await compileTemplate(templateName, templateVars);
    }

    await addJob(
      QUEUE_NAMES.EMAIL,
      templateName || 'send-email',
      { to, subject, html: resolvedHtml },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: { count: 50 },
      }
    );

    logger.info(`Email queued for <${to}> subject="${subject}"`);
  } catch (err) {
    logger.error(`Failed to queue email for <${to}>: ${err.message}`);
    // Never rethrow — email failure must never block the API response.
  }
}

/**
 * Legacy OTP template — kept for auth.controller compatibility.
 */
export function otpTemplate({ otp, firstName, expiryMinutes }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:sans-serif;line-height:1.6;color:#333}
    .container{max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:5px;text-align:center}
    .otp-box{display:inline-block;font-size:32px;font-weight:bold;letter-spacing:5px;padding:15px 30px;background:#f3f4f6;color:#1f2937;border-radius:8px;margin:20px 0;border:1px dashed #cbd5e1}
    .footer{margin-top:25px;font-size:12px;color:#777;border-top:1px solid #eee;padding-top:15px}
  </style></head><body><div class="container">
    <h2>Email Verification OTP</h2>
    <p style="text-align:left">Hello ${firstName},</p>
    <p style="text-align:left">Your one-time password is valid for <strong>${expiryMinutes} minutes</strong>.</p>
    <div class="otp-box">${otp}</div>
    <p style="text-align:left;color:#dc2626;font-weight:bold">Do not share this OTP with anyone.</p>
    <div class="footer"><p>This is an automated email, please do not reply.</p></div>
  </div></body></html>`;
}

export default { sendEmail, queueEmail, otpTemplate };
