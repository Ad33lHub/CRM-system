import { baseApi } from './api.js';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: (period = '30d') => `/analytics/dashboard-stats?period=${period}`,
      providesTags: ['Analytics'],
      keepUnusedDataFor: 300,
    }),
    getRevenueChart: builder.query({
      query: (period = '12m') => `/analytics/revenue-chart?period=${period}`,
      keepUnusedDataFor: 300,
    }),
    getLeadFunnel: builder.query({
      query: () => '/analytics/lead-funnel',
      keepUnusedDataFor: 300,
    }),
    getTaskStatusChart: builder.query({
      query: () => '/analytics/task-status',
      keepUnusedDataFor: 300,
    }),
    getActivityFeed: builder.query({
      query: (params = {}) => ({
        url: '/analytics/activity-feed',
        params: {
          page: params.page || 1,
          limit: params.limit || 30,
          ...(params.entity && { entity: params.entity }),
          ...(params.action && { action: params.action }),
          ...(params.userId && { userId: params.userId }),
          ...(params.dateFrom && { dateFrom: params.dateFrom }),
          ...(params.dateTo && { dateTo: params.dateTo }),
        },
      }),
      providesTags: ['Activity'],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetRevenueChartQuery,
  useGetLeadFunnelQuery,
  useGetTaskStatusChartQuery,
  useGetActivityFeedQuery,
} = analyticsApi;
