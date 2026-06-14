import { baseApi } from './api.js';

export const documentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query({
      query: (params) => ({
        url: '/documents',
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Document', id: _id })),
              { type: 'Document', id: 'LIST' },
            ]
          : [{ type: 'Document', id: 'LIST' }],
    }),
    getDocumentById: builder.query({
      query: (id) => `/documents/${id}`,
      providesTags: (result, error, id) => [{ type: 'Document', id }],
    }),
    downloadDocument: builder.query({
      query: ({ id, version }) => ({
        url: `/documents/${id}/download`,
        params: version ? { version } : {},
      }),
    }),
    deleteDocument: builder.mutation({
      query: (id) => ({
        url: `/documents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Document', id },
        { type: 'Document', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useGetDocumentByIdQuery,
  useLazyDownloadDocumentQuery,
  useDeleteDocumentMutation,
} = documentsApi;
