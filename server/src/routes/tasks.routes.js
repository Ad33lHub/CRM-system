import { Router } from 'express';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/tasks.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from '../validators/task.validator.js';

const router = Router();

router.get(
  '/',
  verifyToken,
  checkPermission('tasks', 'read'),
  validate({ query: taskQuerySchema }),
  listTasks
);

router.get('/:id', verifyToken, checkPermission('tasks', 'read'), getTask);

router.post(
  '/',
  verifyToken,
  checkPermission('tasks', 'create'),
  validate({ body: createTaskSchema }),
  createTask
);

router.patch(
  '/:id',
  verifyToken,
  checkPermission('tasks', 'update'),
  validate({ body: updateTaskSchema }),
  updateTask
);

router.delete('/:id', verifyToken, checkPermission('tasks', 'delete'), deleteTask);

export default router;
