import { baseApi } from './api.js';

export const invoicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: (filters) => ({
        url: '/invoices',
        method: 'GET',
        params: filters,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id, _id }) => ({ type: 'Invoice', id: id || _id })),
              { type: 'Invoice', id: 'LIST' },
            ]
          : [{ type: 'Invoice', id: 'LIST' }],
    }),
    getInvoiceById: builder.query({
      query: (id) => `/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),
    createInvoice: builder.mutation({
      query: (data) => ({
        url: '/invoices',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, data }) => ({
        url: `/invoices/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Invoice', id },
        { type: 'Invoice', id: 'LIST' },
      ],
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Invoice', id },
        { type: 'Invoice', id: 'LIST' },
      ],
    }),
    approvePayment: builder.mutation({
      query: ({ id, data }) => ({
        url: `/invoices/${id}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Invoice', id },
        { type: 'Invoice', id: 'LIST' },
      ],
    }),
    generatePdf: builder.query({
      query: (id) => ({
        url: `/invoices/${id}/pdf`,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useApprovePaymentMutation,
  useGeneratePdfQuery,
} = invoicesApi;
