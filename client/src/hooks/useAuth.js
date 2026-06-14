import { useAppSelector } from '../store/index.js';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAccessToken,
  selectUserRole,
} from '../features/auth/authSlice.js';

export const useAuth = () => {
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const accessToken = useAppSelector(selectAccessToken);
  const role = useAppSelector(selectUserRole);

  return {
    user,
    isAuthenticated,
    role,
    accessToken,
    token: accessToken,
  };
};

export default useAuth;
