import { Router } from 'express';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addTeamMember,
  removeTeamMember,
} from '../controllers/projects.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission, checkRole, clientPortalGuard } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  teamMemberSchema,
} from '../validators/project.validator.js';

const router = Router();

router.get(
  '/',
  verifyToken,
  checkPermission('projects', 'read'),
  validate({ query: projectQuerySchema }),
  listProjects
);

router.get('/:id', verifyToken, checkPermission('projects', 'read'), clientPortalGuard, getProject);

router.post(
  '/',
  verifyToken,
  checkPermission('projects', 'create'),
  validate({ body: createProjectSchema }),
  createProject
);

router.patch(
  '/:id',
  verifyToken,
  checkPermission('projects', 'update'),
  clientPortalGuard,
  validate({ body: updateProjectSchema }),
  updateProject
);

router.delete('/:id', verifyToken, checkRole('super_admin', 'admin'), deleteProject);

router.post(
  '/:id/team',
  verifyToken,
  checkPermission('projects', 'update'),
  validate({ body: teamMemberSchema }),
  addTeamMember
);

router.delete(
  '/:id/team/:userId',
  verifyToken,
  checkPermission('projects', 'update'),
  removeTeamMember
);

export default router;
