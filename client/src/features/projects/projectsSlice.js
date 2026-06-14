import { createSlice } from '@reduxjs/toolkit';

const initialFilters = { status: '', search: '', page: 1, limit: 10 };

const initialState = {
  selectedProject: null,
  activeTab: 'overview',
  filters: initialFilters,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setSelectedProject(state, action) {
      state.selectedProject = action.payload;
    },
    clearSelectedProject(state) {
      state.selectedProject = null;
    },
    setActiveTab(state, action) {
      state.activeTab = action.payload;
    },
    setProjectFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetProjectFilters(state) {
      state.filters = initialFilters;
    },
  },
});

export const {
  setSelectedProject,
  clearSelectedProject,
  setActiveTab,
  setProjectFilters,
  resetProjectFilters,
} = projectsSlice.actions;

export const selectSelectedProject = (state) => state.projects.selectedProject;
export const selectActiveTab = (state) => state.projects.activeTab;
export const selectProjectFilters = (state) => state.projects.filters;

export default projectsSlice.reducer;
