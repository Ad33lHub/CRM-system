import { baseApi } from './api.js';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation({
      query: (data) => ({
        url: '/settings',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),
    broadcast: builder.mutation({
      query: (data) => ({
        url: '/settings/broadcast',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation, useBroadcastMutation } = settingsApi;
