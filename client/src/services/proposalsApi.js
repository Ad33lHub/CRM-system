import { baseApi } from './api.js';

export const proposalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProposals: builder.query({
      query: (params) => ({
        url: '/proposals',
        method: 'GET',
        params,
      }),
      providesTags: ['Lead'],
    }),
    createProposal: builder.mutation({
      query: (data) => ({
        url: '/proposals',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Lead'],
    }),
  }),
});

export const {
  useGetProposalsQuery,
  useCreateProposalMutation,
} = proposalsApi;
