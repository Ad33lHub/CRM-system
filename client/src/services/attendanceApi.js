import { baseApi } from './api.js';

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceLogs: builder.query({
      query: (params) => ({
        url: '/attendance',
        method: 'GET',
        params,
      }),
      providesTags: ['Employee'],
    }),
    checkIn: builder.mutation({
      query: () => ({
        url: '/attendance/check-in',
        method: 'POST',
      }),
      invalidatesTags: ['Employee'],
    }),
    checkOut: builder.mutation({
      query: () => ({
        url: '/attendance/check-out',
        method: 'POST',
      }),
      invalidatesTags: ['Employee'],
    }),
  }),
});

export const {
  useGetAttendanceLogsQuery,
  useCheckInMutation,
  useCheckOutMutation,
} = attendanceApi;
