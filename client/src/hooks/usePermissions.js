import useAuth from './useAuth.js';
import { hasPermission } from '../../../shared/constants/permissions.js';

export const usePermissions = () => {
  const { role } = useAuth();

  const can = (action, resource) => {
    if (!role) return false;
    return hasPermission(role, resource, action);
  };

  return { can };
};

export default usePermissions;
