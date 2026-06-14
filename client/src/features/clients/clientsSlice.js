import { createSlice } from '@reduxjs/toolkit';

const initialFilters = { status: '', search: '', page: 1, limit: 10 };

const initialState = {
  selectedClient: null,
  filters: initialFilters,
};

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setSelectedClient(state, action) {
      state.selectedClient = action.payload;
    },
    clearSelectedClient(state) {
      state.selectedClient = null;
    },
    setClientFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetClientFilters(state) {
      state.filters = initialFilters;
    },
  },
});

export const {
  setSelectedClient,
  clearSelectedClient,
  setClientFilters,
  resetClientFilters,
} = clientsSlice.actions;

export const selectSelectedClient = (state) => state.clients.selectedClient;
export const selectClientFilters = (state) => state.clients.filters;

export default clientsSlice.reducer;
