import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../../lib/axios';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  tier: string;
  role?: string;
  byokKeysCount?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  admin: User | null;
  isAdminAuthenticated: boolean;
  isAdminLoading: boolean;
  isAdminError: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, 
  error: null,

  admin: null,
  isAdminAuthenticated: false,
  isAdminLoading: true,
  isAdminError: null,
};

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Authentication failed');
  }
});

export const checkAdminAuth = createAsyncThunk('auth/checkAdminAuth', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/admin/auth/me');
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Admin authentication failed');
  }
});

export const login = createAsyncThunk('auth/login', async (credentials: any, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  } catch (error: any) {
   
    return rejectWithValue(error.response?.data?.message || 'Failed to login');
  }
});

export const adminLogin = createAsyncThunk('auth/adminLogin', async (credentials: any, { rejectWithValue }) => {
  try {
    const response = await api.post('/admin/auth/login', credentials);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to login as admin');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData: any, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to register');
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to logout');
  }
});

export const adminLogout = createAsyncThunk('auth/adminLogout', async (_, { rejectWithValue }) => {
  try {
    const response = await api.post('/admin/auth/logout');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to logout admin');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAdminError: (state) => {
      state.isAdminError = null;
    },
    forceLogout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    forceAdminLogout: (state) => {
      state.admin = null;
      state.isAdminAuthenticated = false;
      state.isAdminLoading = false;
      state.isAdminError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth (User)
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })

      // Check Admin Auth
      .addCase(checkAdminAuth.pending, (state) => {
        state.isAdminLoading = true;
        state.isAdminError = null;
      })
      .addCase(checkAdminAuth.fulfilled, (state, action: PayloadAction<User>) => {
        state.isAdminLoading = false;
        state.isAdminAuthenticated = true;
        state.admin = action.payload;
      })
      .addCase(checkAdminAuth.rejected, (state) => {
        state.isAdminLoading = false;
        state.isAdminAuthenticated = false;
        state.admin = null;
      })

      // Login (User)
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ user: User }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload ;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Admin Login
      .addCase(adminLogin.pending, (state) => {
        state.isAdminLoading = true;
        state.isAdminError = null;
      })
      .addCase(adminLogin.fulfilled, (state, action: PayloadAction<{ user: User }>) => {
        state.isAdminLoading = false;
        state.isAdminAuthenticated = true;
        state.admin = action.payload.user;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.isAdminLoading = false;
        state.isAdminError = action.payload as string;
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<{ user: User }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Logout (User)
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })

      // Admin Logout
      .addCase(adminLogout.fulfilled, (state) => {
        state.isAdminAuthenticated = false;
        state.admin = null;
        state.isAdminError = null;
      });
  },
});

export const { clearError, clearAdminError, forceLogout, forceAdminLogout } = authSlice.actions;
export default authSlice.reducer;
