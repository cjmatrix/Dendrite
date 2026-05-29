import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import authReducer from '../features/auth/store/authSlice';
import explorerReducer from '../features/explorer/store/explorerSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    explorer: explorerReducer,
  },
  
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
