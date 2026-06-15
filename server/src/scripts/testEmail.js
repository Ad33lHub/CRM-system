/**
 * SMTP smoke test.
 * Usage:  node src/scripts/testEmail.js [recipient@example.com]
 * Verifies the SMTP connection and sends one test email.
 */
import config from '../config/env.js';
import { transporter } from '../services/email.service.js';

const to = process.argv[2] || config.SMTP_USER;

async function run() {
  console.log('── SMTP config ─────────────────────────');
  console.log(`host    : ${config.SMTP_HOST}:${config.SMTP_PORT}  secure=${config.SMTP_SECURE}`);
  console.log(`auth    : ${config.SMTP_USER}`);
  console.log(`from    : "${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_ADDRESS}>`);
  console.log(`sending : ${to}`);
  console.log('────────────────────────────────────────');

  console.log('Verifying SMTP connection…');
  await transporter.verify();
  console.log('✅ SMTP connection OK.');

  const info = await transporter.sendMail({
    from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_ADDRESS}>`,
    to,
    subject: 'CRM SMTP test ✔',
    html: '<h2>It works!</h2><p>Your CRM email settings are configured correctly.</p>',
  });

  console.log(`✅ Test email sent. messageId = ${info.messageId}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Email test FAILED:', err.message);
  console.error('   Check SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS in server/.env');
  process.exit(1);
});
