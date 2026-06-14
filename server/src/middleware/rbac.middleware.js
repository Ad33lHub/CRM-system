import mongoose from 'mongoose';
import * as apiResponse from '../utils/apiResponse.js';

export const PERMISSIONS = {
  super_admin: {
    clients: ['create', 'read', 'update', 'delete'],
    leads: ['create', 'read', 'update', 'delete'],
    projects: ['create', 'read', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete'],
    invoices: ['create', 'read', 'update', 'delete', 'approve'],
    employees: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
    settings: ['read', 'update'],
  },
  admin: {
    clients: ['create', 'read', 'update', 'delete'],
    leads: ['create', 'read', 'update', 'delete'],
    projects: ['create', 'read', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete'],
    invoices: ['create', 'read', 'update', 'delete', 'approve'],
    employees: ['create', 'read', 'update'],
    users: ['create', 'read', 'update'],
    analytics: ['read'],
    settings: ['read', 'update'],
  },
  manager: {
    clients: ['create', 'read', 'update'],
    leads: ['create', 'read', 'update', 'delete'],
    projects: ['create', 'read', 'update'],
    tasks: ['create', 'read', 'update', 'delete'],
    invoices: ['create', 'read', 'update'],
    employees: ['read'],
    analytics: ['read'],
  },
  developer: {
    projects: ['read'],
    tasks: ['read', 'update'],
    clients: ['read'],
  },
  designer: {
    projects: ['read'],
    tasks: ['read', 'update'],
  },
  qa_engineer: {
    projects: ['read'],
    tasks: ['read', 'update'],
  },
  client: {
    // Read-only portal access
    projects: ['read'], // own projects only
    invoices: ['read'], // own invoices only
    tasks: ['read'], // own project tasks only
  },
};

/**
 * Middleware factory to check user roles
 * @param {...String} roles
 */
export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return apiResponse.unauthorised(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return apiResponse.errorResponse(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Middleware factory to check resource action permission
 * @param {String} resource
 * @param {String} action
 */
export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return apiResponse.unauthorised(res, 'Authentication required');
    }

    const rolePermissions = PERMISSIONS[req.user.role];
    if (
      !rolePermissions ||
      !rolePermissions[resource] ||
      !rolePermissions[resource].includes(action)
    ) {
      return apiResponse.errorResponse(
        res,
        `Your role cannot perform '${action}' on '${resource}'`,
        403
      );
    }

    next();
  };
};

/**
 * Middleware factory to check document ownership
 * @param {mongoose.Model} Model
 * @param {String} ownerField
 */
export const checkOwnership = (Model, ownerField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return apiResponse.unauthorised(res, 'Authentication required');
      }

      const document = await Model.findById(req.params.id);
      if (!document) {
        return apiResponse.notFound(res, `${Model.modelName || 'Resource'} not found`);
      }

      req.document = document;

      // Super admin and admin bypass ownership checks
      if (['super_admin', 'admin'].includes(req.user.role)) {
        return next();
      }

      const ownerVal = document[ownerField];
      if (!ownerVal || ownerVal.toString() !== req.user._id.toString()) {
        return apiResponse.errorResponse(res, 'You do not own this resource', 403);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Client portal validation middleware. Restricts access to client-associated company resource data.
 */
export const clientPortalGuard = async (req, res, next) => {
  if (!req.user) {
    return apiResponse.unauthorised(res, 'Authentication required');
  }

  // If role is not client, skip guard checks
  if (req.user.role !== 'client') {
    return next();
  }

  if (!req.user.clientId) {
    return apiResponse.errorResponse(res, 'Access denied. No client profile associated.', 403);
  }

  if (req.params.id) {
    try {
      let doc = req.document;

      if (!doc) {
        const path = req.baseUrl || req.path;
        let modelName = '';

        if (path.includes('projects')) modelName = 'Project';
        else if (path.includes('invoices')) modelName = 'Invoice';
        else if (path.includes('tasks')) modelName = 'Task';
        else if (path.includes('clients')) modelName = 'Client';

        if (modelName) {
          const Model = mongoose.model(modelName);
          doc = await Model.findById(req.params.id);
          if (!doc) {
            return apiResponse.notFound(res, `${modelName} not found`);
          }
          req.document = doc;
        }
      }

      if (doc) {
        const modelName = doc.constructor.modelName;

        if (modelName === 'Client') {
          if (doc._id.toString() !== req.user.clientId.toString()) {
            return apiResponse.errorResponse(
              res,
              'Access denied. You do not own this company profile.',
              403
            );
          }
        } else {
          const clientRef = doc.client || doc.clientId;
          if (!clientRef || clientRef.toString() !== req.user.clientId.toString()) {
            return apiResponse.errorResponse(
              res,
              'Access denied. Resource does not belong to your company.',
              403
            );
          }
        }
      }
    } catch (err) {
      return next(err);
    }
  }

  next();
};

export default {
  checkRole,
  checkPermission,
  checkOwnership,
  clientPortalGuard,
  PERMISSIONS,
};
