import { createSlice } from '@reduxjs/toolkit';

const initialFilters = { stage: '', assignedTo: '', search: '', page: 1, limit: 10 };

const initialState = {
  selectedLead: null,
  pipelineView: true,
  filters: initialFilters,
};

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setSelectedLead(state, action) {
      state.selectedLead = action.payload;
    },
    clearSelectedLead(state) {
      state.selectedLead = null;
    },
    togglePipelineView(state) {
      state.pipelineView = !state.pipelineView;
    },
    setLeadFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetLeadFilters(state) {
      state.filters = initialFilters;
    },
  },
});

export const {
  setSelectedLead,
  clearSelectedLead,
  togglePipelineView,
  setLeadFilters,
  resetLeadFilters,
} = leadsSlice.actions;

export const selectSelectedLead = (state) => state.leads.selectedLead;
export const selectPipelineView = (state) => state.leads.pipelineView;
export const selectLeadFilters = (state) => state.leads.filters;

export default leadsSlice.reducer;
