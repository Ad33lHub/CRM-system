import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Route guard component for authentication and RBAC checks
 * @param {Object} props
 * @param {Array<String>} props.requiredRoles
 */
export default function ProtectedRoute({ requiredRoles = [] }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Confine client-portal users to /portal — they may not enter staff routes.
  if (user?.role === 'client' && !location.pathname.startsWith('/portal')) {
    return <Navigate to="/portal" replace />;
  }

  if (
    requiredRoles &&
    requiredRoles.length > 0 &&
    !requiredRoles.includes('all') &&
    (!user || !requiredRoles.includes(user.role))
  ) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
