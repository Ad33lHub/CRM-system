import { baseApi } from './api.js';

export const clientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClients: builder.query({
      query: (params = {}) => ({
        url: '/clients',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((c) => ({ type: 'Client', id: c._id || c.id })),
              { type: 'Client', id: 'LIST' },
            ]
          : [{ type: 'Client', id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    getClientById: builder.query({
      query: (id) => `/clients/${id}`,
      providesTags: (result, error, id) => [{ type: 'Client', id }],
    }),

    createClient: builder.mutation({
      query: (data) => ({
        url: '/clients',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }],
    }),

    updateClient: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/clients/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Client', id },
        { type: 'Client', id: 'LIST' },
      ],
    }),

    deleteClient: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/clients/${id}`,
        method: 'DELETE',
        body: { reason },
      }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }],
    }),

    restoreClient: builder.mutation({
      query: (id) => ({
        url: `/clients/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }],
    }),

    getDeletedClients: builder.query({
      query: (params = {}) => ({
        url: '/clients/deleted',
        params: { ...params, deleted: true },
      }),
      providesTags: [{ type: 'Client', id: 'DELETED' }],
    }),

    addContact: builder.mutation({
      query: ({ clientId, contact }) => ({
        url: `/clients/${clientId}/contacts`,
        method: 'POST',
        body: contact,
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: 'Client', id: clientId },
      ],
    }),

    removeContact: builder.mutation({
      query: ({ clientId, contactId }) => ({
        url: `/clients/${clientId}/contacts/${contactId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: 'Client', id: clientId },
      ],
    }),

    setPrimaryContact: builder.mutation({
      query: ({ clientId, contactId }) => ({
        url: `/clients/${clientId}/contacts/${contactId}/primary`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: 'Client', id: clientId },
      ],
    }),

    getClientTags: builder.query({
      query: () => '/clients/tags',
      keepUnusedDataFor: 300,
    }),

    getClientProjects: builder.query({
      query: (clientId) => ({
        url: `/projects`,
        params: { client: clientId, limit: 50 },
      }),
      providesTags: ['Project'],
    }),

    getClientInvoices: builder.query({
      query: (clientId) => ({
        url: `/invoices`,
        params: { client: clientId, limit: 50 },
      }),
      providesTags: ['Invoice'],
    }),

    getNotes: builder.query({
      query: ({ clientId, page = 1, limit = 20, search }) => ({
        url: `/clients/${clientId}/notes`,
        params: { page, limit, search },
      }),
      providesTags: (result, error, { clientId }) => [
        { type: 'ClientNote', id: clientId },
        ...(result?.data?.map((n) => ({ type: 'ClientNote', id: n._id || n.id })) || []),
      ],
    }),

    createNote: builder.mutation({
      query: ({ clientId, content, contentText }) => ({
        url: `/clients/${clientId}/notes`,
        method: 'POST',
        body: { content, contentText },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: 'ClientNote', id: clientId },
      ],
    }),

    updateNote: builder.mutation({
      query: ({ clientId, noteId, content, contentText }) => ({
        url: `/clients/${clientId}/notes/${noteId}`,
        method: 'PATCH',
        body: { content, contentText },
      }),
      invalidatesTags: (result, error, { clientId, noteId }) => [
        { type: 'ClientNote', id: clientId },
        { type: 'ClientNote', id: noteId },
      ],
    }),

    deleteNote: builder.mutation({
      query: ({ clientId, noteId }) => ({
        url: `/clients/${clientId}/notes/${noteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { clientId, noteId }) => [
        { type: 'ClientNote', id: clientId },
        { type: 'ClientNote', id: noteId },
      ],
    }),

    togglePin: builder.mutation({
      query: ({ clientId, noteId }) => ({
        url: `/clients/${clientId}/notes/${noteId}/pin`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { clientId, noteId }) => [
        { type: 'ClientNote', id: clientId },
        { type: 'ClientNote', id: noteId },
      ],
    }),

    getStatusLog: builder.query({
      query: (clientId) => `/clients/${clientId}/status-log`,
      providesTags: (result, error, clientId) => [{ type: 'Client', id: clientId }],
    }),

    inviteClientPortal: builder.mutation({
      query: ({ id, email }) => ({
        url: `/clients/${id}/invite`,
        method: 'POST',
        body: email ? { email } : {},
      }),
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useRestoreClientMutation,
  useGetDeletedClientsQuery,
  useAddContactMutation,
  useRemoveContactMutation,
  useSetPrimaryContactMutation,
  useGetClientTagsQuery,
  useGetClientProjectsQuery,
  useGetClientInvoicesQuery,
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useTogglePinMutation,
  useGetStatusLogQuery,
  useInviteClientPortalMutation,
} = clientsApi;
