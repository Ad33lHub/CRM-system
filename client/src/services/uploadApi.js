import { baseApi } from './api.js';

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUploads: builder.query({
      query: (params) => ({
        url: '/upload',
        method: 'GET',
        params,
      }),
      providesTags: [{ type: 'Upload', id: 'LIST' }],
    }),
    deleteUpload: builder.mutation({
      query: (publicId) => ({
        url: `/upload/${encodeURIComponent(publicId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Upload', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetUploadsQuery,
  useDeleteUploadMutation,
} = uploadApi;
