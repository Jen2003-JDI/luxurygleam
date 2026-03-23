import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api';

export const placeOrder = createAsyncThunk('orders/place', async (orderData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/orders', orderData);
    return data.order;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to place order');
  }
});

export const fetchMyOrders = createAsyncThunk('orders/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/orders/my');
    return data.orders;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const fetchOrder = createAsyncThunk('orders/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/orders/${id}`);
    return data.order;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const fetchAllOrders = createAsyncThunk('orders/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/orders', { params });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const updateOrderStatus = createAsyncThunk('orders/updateStatus', async ({ id, status, note }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/orders/${id}/status`, { status, note });
    return data.order;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: { orders: [], selectedOrder: null, loading: false, error: null, placedOrder: null },
  reducers: {
    clearOrderError: (s) => { s.error = null; },
    clearPlacedOrder: (s) => { s.placedOrder = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(placeOrder.fulfilled, (s, a) => { s.loading = false; s.placedOrder = a.payload; s.orders.unshift(a.payload); })
      .addCase(placeOrder.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchMyOrders.pending, (s) => { s.loading = true; })
      .addCase(fetchMyOrders.fulfilled, (s, a) => { s.loading = false; s.orders = a.payload; })
      .addCase(fetchMyOrders.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchOrder.fulfilled, (s, a) => { s.selectedOrder = a.payload; })
      .addCase(fetchAllOrders.fulfilled, (s, a) => { s.orders = a.payload.orders; })
      .addCase(updateOrderStatus.fulfilled, (s, a) => {
        const idx = s.orders.findIndex((o) => o._id === a.payload._id);
        if (idx !== -1) s.orders[idx] = a.payload;
        if (s.selectedOrder?._id === a.payload._id) s.selectedOrder = a.payload;
      });
  },
});

export const { clearOrderError, clearPlacedOrder } = orderSlice.actions;
export default orderSlice.reducer;
