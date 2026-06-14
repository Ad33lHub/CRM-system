import { createSlice } from '@reduxjs/toolkit';

const initialFilters = { status: '', priority: '', assignee: '', page: 1, limit: 20 };

const initialState = {
  selectedTask: null,
  viewMode: 'board',
  filters: initialFilters,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setSelectedTask(state, action) {
      state.selectedTask = action.payload;
    },
    clearSelectedTask(state) {
      state.selectedTask = null;
    },
    setViewMode(state, action) {
      state.viewMode = action.payload;
    },
    setTaskFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetTaskFilters(state) {
      state.filters = initialFilters;
    },
  },
});

export const {
  setSelectedTask,
  clearSelectedTask,
  setViewMode,
  setTaskFilters,
  resetTaskFilters,
} = tasksSlice.actions;

export const selectSelectedTask = (state) => state.tasks.selectedTask;
export const selectViewMode = (state) => state.tasks.viewMode;
export const selectTaskFilters = (state) => state.tasks.filters;

export default tasksSlice.reducer;
