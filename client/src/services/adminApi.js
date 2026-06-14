import { baseApi } from './api.js';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPresenceList: builder.query({
      query: () => '/admin/presence',
      providesTags: ['User'],
    }),
    getActivityDashboard: builder.query({
      query: (params) => ({
        url: '/admin/activity',
        method: 'GET',
        params,
      }),
      providesTags: ['User'],
    }),
  }),
});

export const {
  useGetPresenceListQuery,
  useGetActivityDashboardQuery,
} = adminApi;
