import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import api from '../../../services/api';
import { API_URL } from '../../../constants/theme';

const getApiErrorMessage = (e, fallback) => {
  if (!e?.response) return `Cannot connect to server. API URL: ${API_URL}`;
  return e.response?.data?.message || fallback;
};

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    await SecureStore.setItemAsync('token', data.token);

    try {
      const me = await api.get('/auth/me');
      return { ...data, user: me.data?.user || data.user };
    } catch (_) {
      return data;
    }
  } catch (e) {
    return rejectWithValue(getApiErrorMessage(e, 'Login failed'));
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    await SecureStore.setItemAsync('token', data.token);

    try {
      const me = await api.get('/auth/me');
      return { ...data, user: me.data?.user || data.user };
    } catch (_) {
      return data;
    }
  } catch (e) {
    return rejectWithValue(getApiErrorMessage(e, 'Registration failed'));
  }
});

export const socialLogin = createAsyncThunk('auth/social', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/social', payload);
    await SecureStore.setItemAsync('token', data.token);

    try {
      const me = await api.get('/auth/me');
      return { ...data, user: me.data?.user || data.user };
    } catch (_) {
      return data;
    }
  } catch (e) {
    return rejectWithValue(getApiErrorMessage(e, 'Social login failed'));
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (!token) return rejectWithValue('No token');
    const { data } = await api.get('/auth/me');
    return data;
  } catch (e) {
    await SecureStore.deleteItemAsync('token');
    return rejectWithValue('Session expired');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const isMultipartPayload = typeof FormData !== 'undefined' && payload instanceof FormData;
    const config = isMultipartPayload ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
    const { data } = await api.put('/auth/profile', payload, config);
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Update failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false, error: null, isAuthenticated: false },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      SecureStore.deleteItemAsync('token');
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const fulfilled = (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(loginUser.pending, pending).addCase(loginUser.fulfilled, fulfilled).addCase(loginUser.rejected, rejected)
      .addCase(registerUser.pending, pending).addCase(registerUser.fulfilled, fulfilled).addCase(registerUser.rejected, rejected)
      .addCase(socialLogin.pending, pending).addCase(socialLogin.fulfilled, fulfilled).addCase(socialLogin.rejected, rejected)
      .addCase(loadUser.pending, (state) => { state.loading = true; })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false; state.user = action.payload.user; state.isAuthenticated = true;
      })
      .addCase(loadUser.rejected, (state) => { state.loading = false; state.isAuthenticated = false; })
      .addCase(updateProfile.pending, pending)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false; state.user = action.payload.user;
      })
      .addCase(updateProfile.rejected, rejected);
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
