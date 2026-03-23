import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api';

export const fetchReviews = createAsyncThunk('reviews/fetch', async ({ productId, page = 1 }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/reviews/${productId}`, { params: { page } });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const createReview = createAsyncThunk('reviews/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/reviews', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.review;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to submit review');
  }
});

export const updateReview = createAsyncThunk('reviews/update', async ({ id, formData, ...body }, { rejectWithValue }) => {
  try {
    const payload = formData || body;
    const config = formData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
    const { data } = await api.put(`/reviews/${id}`, payload, config);
    return data.review;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const deleteReview = createAsyncThunk('reviews/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/reviews/${id}`);
    return id;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const checkCanReview = createAsyncThunk('reviews/canReview', async ({ productId, orderId }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/reviews/can-review/${productId}/${orderId}`);
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const replyToReview = createAsyncThunk('reviews/reply', async ({ reviewId, text }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/reviews/${reviewId}/reply`, { text });
    return data.review;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const getAllReviews = createAsyncThunk('reviews/getAllReviews', async ({ page = 1, status = 'all', productId }, { rejectWithValue }) => {
  try {
    const params = { page, limit: 20 };
    if (status !== 'all') params.status = status;
    if (productId) params.productId = productId;
    const { data } = await api.get('/reviews/admin/all', { params });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const toggleReviewHidden = createAsyncThunk('reviews/toggleHidden', async (reviewId, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/reviews/${reviewId}/toggle-hidden`);
    return data.review;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const updateReviewStatus = createAsyncThunk('reviews/updateStatus', async ({ reviewId, status }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/reviews/${reviewId}/status`, { status });
    return data.review;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const fetchReviewAnalytics = createAsyncThunk('reviews/fetchAnalytics', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/reviews/admin/analytics');
    return data.analytics;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: { 
    reviews: [], 
    allReviews: [],
    loading: false, 
    error: null, 
    canReview: false, 
    alreadyReviewed: false,
    analytics: null,
    adminLoading: false,
  },
  reducers: { 
    clearReviewError: (s) => { s.error = null; } 
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (s) => { s.loading = true; })
      .addCase(fetchReviews.fulfilled, (s, a) => { s.loading = false; s.reviews = a.payload.reviews; })
      .addCase(fetchReviews.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createReview.fulfilled, (s, a) => { s.reviews.unshift(a.payload); s.alreadyReviewed = true; s.canReview = false; })
      .addCase(updateReview.fulfilled, (s, a) => {
        const idx = s.reviews.findIndex((r) => r._id === a.payload._id);
        if (idx !== -1) s.reviews[idx] = a.payload;
      })
      .addCase(deleteReview.fulfilled, (s, a) => { s.reviews = s.reviews.filter((r) => r._id !== a.payload); })
      .addCase(checkCanReview.fulfilled, (s, a) => { s.canReview = a.payload.canReview; s.alreadyReviewed = a.payload.alreadyReviewed; })
      .addCase(replyToReview.fulfilled, (s, a) => {
        const idx = s.reviews.findIndex((r) => r._id === a.payload._id);
        if (idx !== -1) s.reviews[idx] = a.payload;
      })
      // Admin endpoints
      .addCase(getAllReviews.pending, (s) => { s.adminLoading = true; })
      .addCase(getAllReviews.fulfilled, (s, a) => { 
        s.adminLoading = false; 
        s.allReviews = a.payload.reviews; 
      })
      .addCase(getAllReviews.rejected, (s, a) => { s.adminLoading = false; s.error = a.payload; })
      .addCase(toggleReviewHidden.fulfilled, (s, a) => {
        const idx = s.allReviews.findIndex((r) => r._id === a.payload._id);
        if (idx !== -1) s.allReviews[idx] = a.payload;
      })
      .addCase(updateReviewStatus.fulfilled, (s, a) => {
        const idx = s.allReviews.findIndex((r) => r._id === a.payload._id);
        if (idx !== -1) s.allReviews[idx] = a.payload;
      })
      .addCase(fetchReviewAnalytics.fulfilled, (s, a) => { s.analytics = a.payload; });
  },
});

export const { clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;
