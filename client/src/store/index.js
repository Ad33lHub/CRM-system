/* global process */
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { rootReducer } from './rootReducer.js';
import { baseApi } from '../services/api.js';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(baseApi.middleware),
  devTools: typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : import.meta.env.DEV,
});

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

export default store;
