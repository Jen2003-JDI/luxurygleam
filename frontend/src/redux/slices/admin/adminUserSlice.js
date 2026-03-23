import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api';

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const fetchAllUsers = createAsyncThunk(
  'adminUsers/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/users', { params });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'adminUsers/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/users/${id}`);
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'adminUsers/update',
  async ({ id, ...body }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/users/${id}`, body);
      return data.user;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update user');
    }
  }
);

export const updateUserRole = createAsyncThunk(
  'adminUsers/updateRole',
  async ({ id, role }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/users/${id}/role`, { role });
      return data.user;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update role');
    }
  }
);

export const toggleUserStatus = createAsyncThunk(
  'adminUsers/toggleStatus',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/users/${id}/status`);
      return data.user;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to toggle status');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'adminUsers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to delete user');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const adminUserSlice = createSlice({
  name: 'adminUsers',
  initialState: {
    users: [],
    selectedUser: null,
    selectedUserStats: null,
    loading: false,
    actionLoading: false,
    error: null,
    total: 0,
    pages: 1,
  },
  reducers: {
    clearAdminUserError: (state) => { state.error = null; },
    clearSelectedUser: (state) => { state.selectedUser = null; state.selectedUserStats = null; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAllUsers.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAllUsers.fulfilled, (s, a) => {
        s.loading = false;
        s.users = a.payload.users;
        s.total = a.payload.total;
        s.pages = a.payload.pages;
      })
      .addCase(fetchAllUsers.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      // Fetch one
      .addCase(fetchUserById.pending, (s) => { s.loading = true; })
      .addCase(fetchUserById.fulfilled, (s, a) => {
        s.loading = false;
        s.selectedUser = a.payload.user;
        s.selectedUserStats = a.payload.stats;
      })
      .addCase(fetchUserById.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      // Update user
      .addCase(updateUser.pending, (s) => { s.actionLoading = true; })
      .addCase(updateUser.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.users.findIndex((u) => u._id === a.payload._id);
        if (idx !== -1) s.users[idx] = a.payload;
        if (s.selectedUser?._id === a.payload._id) s.selectedUser = a.payload;
      })
      .addCase(updateUser.rejected, (s, a) => { s.actionLoading = false; s.error = a.payload; })

      // Update role
      .addCase(updateUserRole.pending, (s) => { s.actionLoading = true; })
      .addCase(updateUserRole.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.users.findIndex((u) => u._id === a.payload._id);
        if (idx !== -1) s.users[idx] = a.payload;
        if (s.selectedUser?._id === a.payload._id) s.selectedUser = a.payload;
      })
      .addCase(updateUserRole.rejected, (s, a) => { s.actionLoading = false; s.error = a.payload; })

      // Toggle status
      .addCase(toggleUserStatus.fulfilled, (s, a) => {
        const idx = s.users.findIndex((u) => u._id === a.payload._id);
        if (idx !== -1) s.users[idx] = { ...s.users[idx], isActive: a.payload.isActive };
        if (s.selectedUser?._id === a.payload._id) s.selectedUser = { ...s.selectedUser, isActive: a.payload.isActive };
      })

      // Delete user
      .addCase(deleteUser.fulfilled, (s, a) => {
        s.users = s.users.filter((u) => u._id !== a.payload);
        s.total = Math.max(0, s.total - 1);
      });
  },
});

export const { clearAdminUserError, clearSelectedUser } = adminUserSlice.actions;
export default adminUserSlice.reducer;
