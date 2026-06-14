import { createSlice } from '@reduxjs/toolkit';

const initialFilters = { status: '', search: '', dateFrom: '', dateTo: '', page: 1, limit: 10 };

const initialState = {
  selectedInvoice: null,
  filters: initialFilters,
};

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setSelectedInvoice(state, action) {
      state.selectedInvoice = action.payload;
    },
    clearSelectedInvoice(state) {
      state.selectedInvoice = null;
    },
    setInvoiceFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetInvoiceFilters(state) {
      state.filters = initialFilters;
    },
  },
});

export const {
  setSelectedInvoice,
  clearSelectedInvoice,
  setInvoiceFilters,
  resetInvoiceFilters,
} = invoicesSlice.actions;

export const selectSelectedInvoice = (state) => state.invoices.selectedInvoice;
export const selectInvoiceFilters = (state) => state.invoices.filters;

export default invoicesSlice.reducer;
