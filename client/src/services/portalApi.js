import { baseApi } from './api.js';

// The client portal reuses the client-scoped /projects and /invoices endpoints
// (the server filters them by the logged-in client) and adds per-project message
// threads under /portal.
export const portalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPortalProjects: builder.query({
      query: () => ({ url: '/projects', method: 'GET' }),
      providesTags: [{ type: 'Project', id: 'PORTAL_LIST' }],
    }),
    getPortalProject: builder.query({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),
    getPortalInvoices: builder.query({
      query: () => ({ url: '/invoices', method: 'GET' }),
      providesTags: [{ type: 'Invoice', id: 'PORTAL_LIST' }],
    }),
    getPortalThreads: builder.query({
      query: () => '/portal/threads',
      providesTags: [{ type: 'PortalThread', id: 'LIST' }],
    }),
    getPortalMessages: builder.query({
      query: (projectId) => `/portal/messages?projectId=${projectId}`,
      providesTags: (result, error, projectId) => [{ type: 'PortalMessage', id: projectId }],
    }),
    sendPortalMessage: builder.mutation({
      query: (data) => ({ url: '/portal/messages', method: 'POST', body: data }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'PortalMessage', id: projectId },
        { type: 'PortalThread', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetPortalProjectsQuery,
  useGetPortalProjectQuery,
  useGetPortalInvoicesQuery,
  useGetPortalThreadsQuery,
  useGetPortalMessagesQuery,
  useSendPortalMessageMutation,
} = portalApi;
