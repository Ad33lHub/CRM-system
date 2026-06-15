import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../lib/axios.js';
import { setCredentials, clearCredentials } from '../features/auth/authSlice.js';

/**
 * Custom hook to initialize authentication state on application load.
 * Attempts a silent token refresh and hydrates the user profile.
 */
export default function useAuthInit() {
  const dispatch = useDispatch();
  const [isInitialised, setIsInitialised] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // Attempt silent refresh with a short timeout so the UI loads fast
        const refreshRes = await api.post('/auth/refresh', {}, { timeout: 3000 });
        const accessToken = refreshRes.data?.data?.accessToken;

        if (accessToken && isMounted) {
          // Temporarily dispatch the token so the request interceptor includes it
          dispatch(setCredentials({ user: null, accessToken }));

          // Retrieve full profile hydration
          const meRes = await api.get('/auth/me');
          const meData = meRes.data?.data;

          if (isMounted) {
            dispatch(setCredentials({ user: meData, accessToken }));
          }
        }
      } catch (err) {
        if (isMounted) {
          dispatch(clearCredentials());
        }
      } finally {
        if (isMounted) {
          setIsInitialised(true);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return { isInitialised };
}
