import { baseApi } from './api.js';

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: (filters) => ({
        url: '/employees',
        method: 'GET',
        params: filters,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id, _id }) => ({ type: 'Employee', id: id || _id })),
              { type: 'Employee', id: 'LIST' },
            ]
          : [{ type: 'Employee', id: 'LIST' }],
    }),
    getEmployeeById: builder.query({
      query: (id) => `/employees/${id}`,
      providesTags: (result, error, id) => [{ type: 'Employee', id }],
    }),
    createEmployee: builder.mutation({
      query: (data) => ({
        url: '/employees',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, data }) => ({
        url: `/employees/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
      ],
    }),
    changeEmployeeRole: builder.mutation({
      query: ({ id, data }) => ({
        url: `/employees/${id}/role`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
      ],
    }),
    getAttendance: builder.query({
      query: (id) => `/employees/${id}/attendance`,
      providesTags: (result, error, id) => [{ type: 'Employee', id: `ATTENDANCE_${id}` }],
    }),
    applyLeave: builder.mutation({
      query: (data) => ({
        url: '/employees/leave',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useChangeEmployeeRoleMutation,
  useGetAttendanceQuery,
  useApplyLeaveMutation,
} = employeesApi;
