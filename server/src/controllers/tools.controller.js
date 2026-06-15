import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { writeBusinessEmail } from '../services/ai.service.js';

const TONE_OPENERS = {
  professional: 'I hope this message finds you well.',
  formal: 'I trust this message reaches you in good standing.',
  casual: 'Hope you’re doing great!',
  persuasive: 'I’m reaching out with something I believe will genuinely help you.',
};

// Deterministic draft used when no AI key is configured (or the API errors),
// so the tool always returns a usable email.
function fallbackEmail({ recipient, tone, points, senderName }) {
  const bullets = String(points)
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join('\n');

  return `Subject: Quick update & next steps

Dear ${recipient || 'there'},

${TONE_OPENERS[tone] || TONE_OPENERS.professional}

I wanted to share the following:
${bullets}

Please let me know if you have any questions or would like to set up a quick call to discuss further.

Best regards,
${senderName || 'The Team'}`;
}

export const writeEmail = asyncHandler(async (req, res) => {
  const { recipient, tone = 'professional', points } = req.body;
  const senderName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();

  const aiEmail = await writeBusinessEmail({ recipient, tone, points, senderName });
  const email = aiEmail || fallbackEmail({ recipient, tone, points, senderName });

  return successResponse(
    res,
    { email, generatedByAi: Boolean(aiEmail) },
    'Email draft generated successfully'
  );
});
