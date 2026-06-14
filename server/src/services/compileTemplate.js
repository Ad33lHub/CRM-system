import mjml2html from 'mjml';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, 'emailTemplates');

const compiledCache = new Map();

async function loadAndCompile(templateName) {
  const filePath = join(TEMPLATES_DIR, `${templateName}.mjml`);
  const mjmlSource = await readFile(filePath, 'utf8');
  const { html, errors } = mjml2html(mjmlSource, { validationLevel: 'skip' });

  if (errors.length > 0) {
    errors.forEach((e) => logger.warn(`MJML warning in ${templateName}: ${e.formattedMessage}`));
  }

  return html;
}

export async function compileTemplate(templateName, variables = {}) {
  if (!compiledCache.has(templateName)) {
    const html = await loadAndCompile(templateName);
    compiledCache.set(templateName, html);
    logger.info(`MJML template compiled and cached: ${templateName}`);
  }

  let html = compiledCache.get(templateName);

  for (const [key, value] of Object.entries(variables)) {
    const safeValue = value != null ? String(value) : '';
    html = html.split(`{{${key}}}`).join(safeValue);
  }

  return html;
}

export function clearTemplateCache() {
  compiledCache.clear();
}
