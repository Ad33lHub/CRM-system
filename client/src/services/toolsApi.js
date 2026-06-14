import { baseApi } from './api.js';

export const toolsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    writeEmail: builder.mutation({
      query: (data) => ({
        url: '/tools/email-writer',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useWriteEmailMutation,
} = toolsApi;
