import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clearCredentials, setCredentials } from '../features/auth/authSlice.js';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
  credentials: 'include',
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const url = typeof args === 'string' ? args : args?.url;
  const isAuthRequest = url?.includes('/auth/refresh') || url?.includes('/auth/login');

  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 && !isAuthRequest) {
    // Try to get a new token via refresh request
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );

    // The server wraps responses in the standard envelope: { success, message, data }
    const refreshPayload = refreshResult.data?.data;
    if (refreshPayload?.accessToken) {
      // Store the new credentials in Redux
      const currentUser = api.getState().auth.user;
      api.dispatch(
        setCredentials({
          user: refreshPayload.user || currentUser,
          accessToken: refreshPayload.accessToken,
        })
      );
      // Retry the initial query with the new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed, clear session
      api.dispatch(clearCredentials());
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Client',
    'Lead',
    'Project',
    'Task',
    'Invoice',
    'Employee',
    'Notification',
    'Analytics',
    'ClientNote',
    'Meeting',
    'Chat',
    'Document',
    'Upload',
    'Attendance',
    'Report',
    'Proposal',
    'Admin',
    'Tool',
  ],
  endpoints: () => ({}),
});
