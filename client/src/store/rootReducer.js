import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import clientsReducer from '../features/clients/clientsSlice.js';
import leadsReducer from '../features/leads/leadsSlice.js';
import projectsReducer from '../features/projects/projectsSlice.js';
import tasksReducer from '../features/tasks/tasksSlice.js';
import invoicesReducer from '../features/invoices/invoicesSlice.js';
import employeesReducer from '../features/employees/employeesSlice.js';
import notificationsReducer from '../features/notifications/notificationsSlice.js';
import { baseApi } from '../services/api.js';

export const rootReducer = combineReducers({
  auth: authReducer,
  clients: clientsReducer,
  leads: leadsReducer,
  projects: projectsReducer,
  tasks: tasksReducer,
  invoices: invoicesReducer,
  employees: employeesReducer,
  notifications: notificationsReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export default rootReducer;
