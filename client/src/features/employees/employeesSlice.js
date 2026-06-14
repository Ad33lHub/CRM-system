import { createSlice } from '@reduxjs/toolkit';

const initialFilters = { department: '', search: '', page: 1, limit: 10 };

const initialState = {
  selectedEmployee: null,
  filters: initialFilters,
};

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setSelectedEmployee(state, action) {
      state.selectedEmployee = action.payload;
    },
    clearSelectedEmployee(state) {
      state.selectedEmployee = null;
    },
    setEmployeeFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetEmployeeFilters(state) {
      state.filters = initialFilters;
    },
  },
});

export const {
  setSelectedEmployee,
  clearSelectedEmployee,
  setEmployeeFilters,
  resetEmployeeFilters,
} = employeesSlice.actions;

export const selectSelectedEmployee = (state) => state.employees.selectedEmployee;
export const selectEmployeeFilters = (state) => state.employees.filters;

export default employeesSlice.reducer;
