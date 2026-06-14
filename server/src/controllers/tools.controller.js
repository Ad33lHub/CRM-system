import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const writeEmail = asyncHandler(async (req, res) => {
  const { recipient, points } = req.body;

  // Simulate AI Email generation
  const bulletPoints = Array.isArray(points) ? points : [points];
  const generatedEmail = `Subject: Project Progression Sync & Next Deliverables

Dear ${recipient || 'Valued Client'},

I hope this email finds you well.

I am writing to provide a quick update on our recent project milestones. Specifically:
${bulletPoints.map((pt) => `- ${pt}`).join('\n')}

We are moving forward on schedule and will keep you updated as additional deliverables are completed. Please let me know if you have any questions or would like to schedule a quick call to sync.

Best regards,
${req.user.firstName} ${req.user.lastName}
Software House Team
`;

  return successResponse(res, { email: generatedEmail }, 'Email draft generated successfully');
});
