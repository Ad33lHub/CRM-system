import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employees.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  checkPermission,
  checkRole,
  checkEmployeeCreateAccess,
} from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
} from '../validators/employee.validator.js';

const router = Router();

router.get(
  '/',
  verifyToken,
  checkPermission('employees', 'read'),
  validate({ query: employeeQuerySchema }),
  listEmployees
);

router.get('/:id', verifyToken, checkPermission('employees', 'read'), getEmployee);

router.post(
  '/',
  verifyToken,
  checkEmployeeCreateAccess,
  validate({ body: createEmployeeSchema }),
  createEmployee
);

router.patch(
  '/:id',
  verifyToken,
  checkRole('super_admin', 'admin'),
  validate({ body: updateEmployeeSchema }),
  updateEmployee
);

router.delete('/:id', verifyToken, checkRole('super_admin'), deleteEmployee);

export default router;
