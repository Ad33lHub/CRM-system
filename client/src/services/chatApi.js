import { baseApi } from './api.js';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChannels: builder.query({
      query: () => '/chat/channels',
      providesTags: ['Chat'],
    }),
    createChannel: builder.mutation({
      query: (data) => ({
        url: '/chat/channels',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chat'],
    }),
    archiveChannel: builder.mutation({
      query: (channelId) => ({
        url: `/chat/channels/${channelId}/archive`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Chat'],
    }),
    getChannelMembers: builder.query({
      query: (channelId) => `/chat/channels/${channelId}/members`,
      providesTags: (result, error, channelId) => [{ type: 'Chat', id: `members-${channelId}` }],
    }),
    getMessages: builder.query({
      query: (channelId) => `/chat/messages/${channelId}`,
      providesTags: (result, error, channelId) => [{ type: 'Chat', id: channelId }],
    }),
    sendMessage: builder.mutation({
      query: (data) => ({
        url: '/chat/messages',
        method: 'POST',
        body: {
          channelId: data.channelId,
          content: data.content,
          recipient: data.recipient || 'everyone',
          attachments: data.attachments || [],
        },
      }),
      invalidatesTags: (result, error, { channelId }) => [
        { type: 'Chat', id: channelId },
      ],
    }),
    deleteMessage: builder.mutation({
      query: (messageId) => ({
        url: `/chat/messages/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chat'],
    }),
    pinMessage: builder.mutation({
      query: (messageId) => ({
        url: `/chat/messages/${messageId}/pin`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Chat'],
    }),
  }),
});

export const {
  useGetChannelsQuery,
  useCreateChannelMutation,
  useArchiveChannelMutation,
  useGetChannelMembersQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  usePinMessageMutation,
} = chatApi;
