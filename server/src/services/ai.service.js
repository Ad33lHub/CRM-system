import config from '../config/env.js';
import logger from '../utils/logger.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** True when a Gemini API key is configured. */
export function isAiEnabled() {
  return Boolean(config.GEMINI_API_KEY);
}

/**
 * Low-level Gemini text completion.
 * Returns the generated text, or `null` when AI is unavailable or errors —
 * callers fall back to a deterministic template so the feature never breaks.
 */
export async function generateText({ system, prompt, temperature = 0.6, maxOutputTokens = 1024 }) {
  if (!config.GEMINI_API_KEY) return null;

  const url = `${GEMINI_BASE}/${config.GEMINI_MODEL}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens },
  };
  if (system) {
    body.system_instruction = { parts: [{ text: system }] };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      logger.error(`Gemini request failed (${res.status}): ${errText.slice(0, 400)}`);
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join('')
      .trim();

    return text || null;
  } catch (err) {
    logger.error(`Gemini request error: ${err.message}`);
    return null;
  }
}

/**
 * Compose a business email. Returns AI text, or null to let the caller fall back.
 */
export async function writeBusinessEmail({ recipient, tone = 'professional', points, senderName }) {
  const system =
    'You are an expert business copywriter for a software house. Write clear, concise, well-structured emails. ' +
    'Start with a single "Subject:" line, then the body with a greeting and sign-off. ' +
    'Output ONLY the email text — no explanations, no markdown code fences.';

  const prompt = [
    `Write a ${tone} business email.`,
    `Recipient / context: ${recipient}`,
    'Key points to cover:',
    points,
    senderName ? `Sign the email off from: ${senderName}.` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return generateText({ system, prompt, temperature: 0.6, maxOutputTokens: 800 });
}

/**
 * Generate a client proposal brief. Returns AI text, or null to let the caller fall back.
 */
export async function writeProposalBrief({
  title,
  companyName,
  description,
  budget,
  timeline,
  currency = 'PKR',
}) {
  const system =
    'You are a senior solutions consultant at a software house writing winning client proposals. ' +
    'Produce a structured proposal in Markdown with these sections: Executive Summary, Scope & Deliverables, ' +
    'Timeline & Milestones, Investment, and Why Choose Us. Be specific and professional. Output ONLY the proposal.';

  const prompt = [
    `Proposal title: ${title}`,
    companyName ? `Client company: ${companyName}` : '',
    description
      ? `Project details / requirements:\n${description}`
      : 'No extra details were provided; infer a sensible software project scope.',
    `Budget: ${budget ? `${currency} ${budget}` : 'to be proposed'}`,
    `Timeline: ${timeline || 'to be proposed'}`,
  ]
    .filter(Boolean)
    .join('\n');

  return generateText({ system, prompt, temperature: 0.65, maxOutputTokens: 1600 });
}

export default { isAiEnabled, generateText, writeBusinessEmail, writeProposalBrief };
