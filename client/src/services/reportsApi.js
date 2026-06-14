import { baseApi } from './api.js';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query({
      query: () => '/reports',
      providesTags: ['Analytics'],
    }),
  }),
});

export const { useGetReportsQuery } = reportsApi;
