import { baseApi } from './api.js';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChannels: builder.query({
      query: () => '/chat/channels',
      providesTags: ['Chat'],
    }),
    getMessages: builder.query({
      query: (channelId) => `/chat/messages/${channelId}`,
      providesTags: (result, error, channelId) => [{ type: 'Chat', id: channelId }],
    }),
    sendMessage: builder.mutation({
      query: (data) => ({
        url: '/chat/messages',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { channelId }) => [
        { type: 'Chat', id: channelId },
      ],
    }),
  }),
});

export const {
  useGetChannelsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} = chatApi;
