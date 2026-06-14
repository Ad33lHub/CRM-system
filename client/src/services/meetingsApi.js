import { baseApi } from './api.js';

export const meetingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMeetings: builder.query({
      query: (params) => ({
        url: '/meetings',
        method: 'GET',
        params,
      }),
      providesTags: ['Meeting'],
    }),
    getMeetingById: builder.query({
      query: (id) => `/meetings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Meeting', id }],
    }),
    createMeeting: builder.mutation({
      query: (data) => ({
        url: '/meetings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Meeting'],
    }),
  }),
});

export const {
  useGetMeetingsQuery,
  useGetMeetingByIdQuery,
  useCreateMeetingMutation,
} = meetingsApi;
