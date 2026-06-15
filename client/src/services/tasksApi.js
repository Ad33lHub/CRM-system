import { baseApi } from './api.js';

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: (filters) => ({
        url: '/tasks',
        method: 'GET',
        params: filters,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id, _id }) => ({ type: 'Task', id: id || _id })),
              { type: 'Task', id: 'LIST' },
            ]
          : [{ type: 'Task', id: 'LIST' }],
    }),
    getTaskById: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),
    createTask: builder.mutation({
      query: (data) => ({
        url: '/tasks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    updateTask: builder.mutation({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: 'PATCH',
        body: data,
      }),
      // Optimistic update: patch the cache instantly so the UI reflects the change
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled, getState }) {
        // Patch all cached getTasks queries
        const patchResults = [];
        for (const { endpointName, originalArgs } of baseApi.util.selectInvalidatedBy(
          getState(),
          [{ type: 'Task', id: 'LIST' }]
        )) {
          if (endpointName === 'getTasks') {
            const patch = dispatch(
              tasksApi.util.updateQueryData('getTasks', originalArgs, (draft) => {
                const items = draft?.data || draft;
                if (Array.isArray(items)) {
                  const task = items.find((t) => (t.id || t._id) === id);
                  if (task) Object.assign(task, data);
                }
              })
            );
            patchResults.push(patch);
          }
        }
        // Also patch the individual task cache
        const detailPatch = dispatch(
          tasksApi.util.updateQueryData('getTaskById', id, (draft) => {
            const task = draft?.data || draft;
            if (task) Object.assign(task, data);
          })
        );
        patchResults.push(detailPatch);

        try {
          await queryFulfilled;
        } catch {
          // Roll back all optimistic patches on failure
          patchResults.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    updateTaskStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/tasks/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      // Optimistic update: move the card to the new column instantly
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled, getState }) {
        const patchResults = [];
        for (const { endpointName, originalArgs } of baseApi.util.selectInvalidatedBy(
          getState(),
          [{ type: 'Task', id: 'LIST' }]
        )) {
          if (endpointName === 'getTasks') {
            const patch = dispatch(
              tasksApi.util.updateQueryData('getTasks', originalArgs, (draft) => {
                const items = draft?.data || draft;
                if (Array.isArray(items)) {
                  const task = items.find((t) => (t.id || t._id) === id);
                  if (task) task.status = status;
                }
              })
            );
            patchResults.push(patch);
          }
        }
        const detailPatch = dispatch(
          tasksApi.util.updateQueryData('getTaskById', id, (draft) => {
            const task = draft?.data || draft;
            if (task) task.status = status;
          })
        );
        patchResults.push(detailPatch);

        try {
          await queryFulfilled;
        } catch {
          patchResults.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
} = tasksApi;
