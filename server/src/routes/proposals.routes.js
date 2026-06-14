import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';
import { getProposals, createProposal } from '../controllers/proposals.controller.js';
import { createProposalSchema, proposalQuerySchema } from '../validators/proposal.validator.js';

const router = Router();

router.get('/', verifyToken, validate({ query: proposalQuerySchema }), getProposals);
router.post(
  '/',
  verifyToken,
  checkPermission('leads', 'create'),
  aiLimiter,
  validate(createProposalSchema),
  createProposal
);

export default router;
