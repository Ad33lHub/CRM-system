/**
 * Invoice email smoke test.
 * Compiles the real `invoiceSent` MJML template with sample data and sends it,
 * exercising the exact email a client receives from Invoices → Send Invoice.
 *
 * Usage:  node src/scripts/testInvoiceEmail.js [recipient@example.com]
 */
import config from '../config/env.js';
import { transporter } from '../services/email.service.js';
import { compileTemplate } from '../services/compileTemplate.js';

const to = process.argv[2] || config.SMTP_USER;

const templateVars = {
  clientName: 'Muhammad Eel',
  invoiceNumber: 'INV-TEST-0001',
  amount: (125000).toLocaleString(),
  currency: 'PKR',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-PK'),
  invoiceUrl: `${config.CLIENT_URL || 'https://app.verixsoft.com'}/portal/invoices/test`,
  unsubscribeUrl: '#',
};

async function run() {
  console.log('── Invoice email test ──────────────────');
  console.log(`from    : "${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_ADDRESS}>`);
  console.log(`sending : ${to}`);
  console.log('────────────────────────────────────────');

  console.log('Verifying SMTP connection…');
  await transporter.verify();
  console.log('✅ SMTP connection OK.');

  const html = await compileTemplate('invoiceSent', templateVars);

  const info = await transporter.sendMail({
    from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_ADDRESS}>`,
    to,
    subject: `Invoice ${templateVars.invoiceNumber} from Verixsoft`,
    html,
  });

  console.log(`✅ Invoice email sent. messageId = ${info.messageId}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Invoice email test FAILED:', err.message);
  process.exit(1);
});
