import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api';

export const fetchSalesAnalytics = createAsyncThunk(
  'analytics/fetchSales',
  async (year, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/orders/analytics', { params: { year } });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load analytics');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    summary: null,
    months: [],
    topProducts: [],
    categoryStats: [],
    statusBreakdown: [],
    year: new Date().getFullYear(),
    loading: false,
    error: null,
  },
  reducers: {
    setYear: (state, action) => { state.year = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesAnalytics.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchSalesAnalytics.fulfilled, (s, a) => {
        s.loading = false;
        s.summary = a.payload.summary;
        s.months = a.payload.months;
        s.topProducts = a.payload.topProducts;
        s.categoryStats = a.payload.categoryStats;
        s.statusBreakdown = a.payload.statusBreakdown;
        s.year = a.payload.year;
      })
      .addCase(fetchSalesAnalytics.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { setYear } = analyticsSlice.actions;
export default analyticsSlice.reducer;
