import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/notifications');
    return data.notifications;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try {
    await api.put(`/notifications/${id}/read`);
    return id;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await api.put('/notifications/read-all');
    return true;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { notifications: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => { s.loading = true; })
      .addCase(fetchNotifications.fulfilled, (s, a) => { s.loading = false; s.notifications = a.payload; })
      .addCase(fetchNotifications.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(markNotificationRead.fulfilled, (s, a) => {
        const n = s.notifications.find((n) => n._id === a.payload);
        if (n) n.isRead = true;
      })
      .addCase(markAllNotificationsRead.fulfilled, (s) => {
        s.notifications.forEach((n) => { n.isRead = true; });
      });
  },
});

export default notificationSlice.reducer;
export const selectUnreadCount = (state) => state.notifications.notifications.filter((n) => !n.isRead).length;
