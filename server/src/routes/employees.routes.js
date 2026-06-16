import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  changeEmployeeRole,
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
  changeRoleSchema,
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

// Promote/change an employee's security role + manager type — super_admin only.
router.patch(
  '/:id/role',
  verifyToken,
  checkRole('super_admin'),
  validate({ body: changeRoleSchema }),
  changeEmployeeRole
);

router.delete('/:id', verifyToken, checkRole('super_admin'), deleteEmployee);

export default router;
