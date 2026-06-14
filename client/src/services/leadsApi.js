import { baseApi } from './api.js';

export const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query({
      query: (filters) => ({
        url: '/leads',
        method: 'GET',
        params: filters,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id, _id }) => ({ type: 'Lead', id: id || _id })),
              { type: 'Lead', id: 'LIST' },
            ]
          : [{ type: 'Lead', id: 'LIST' }],
    }),
    getLeadById: builder.query({
      query: (id) => `/leads/${id}`,
      providesTags: (result, error, id) => [{ type: 'Lead', id }],
    }),
    createLead: builder.mutation({
      query: (data) => ({
        url: '/leads',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Lead', id: 'LIST' }],
    }),
    updateLead: builder.mutation({
      query: ({ id, data }) => ({
        url: `/leads/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
      ],
    }),
    deleteLead: builder.mutation({
      query: (id) => ({
        url: `/leads/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
      ],
    }),
    updateLeadStage: builder.mutation({
      query: ({ id, stage }) => ({
        url: `/leads/${id}/stage`,
        method: 'PATCH',
        body: { stage },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
      ],
    }),
    convertLead: builder.mutation({
      query: ({ id, clientId }) => ({
        url: `/leads/${id}/convert`,
        method: 'POST',
        body: { clientId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
        { type: 'Client', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadByIdQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useUpdateLeadStageMutation,
  useConvertLeadMutation,
} = leadsApi;
