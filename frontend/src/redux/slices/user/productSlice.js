import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api';

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products', { params });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch products');
  }
});

export const fetchProduct = createAsyncThunk('products/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/products/${id}`);
    return data.product;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch product');
  }
});

export const fetchFeatured = createAsyncThunk('products/featured', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products/featured');
    return data.products;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const createProduct = createAsyncThunk('products/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.product;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to create product');
  }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const isMultipartPayload = typeof FormData !== 'undefined' && data instanceof FormData;
    const config = isMultipartPayload ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
    const response = await api.put(`/products/${id}`, data, config);
    return response.data.product;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update product');
  }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/products/${id}`);
    return id;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to delete product');
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    products: [], featured: [], selectedProduct: null,
    loading: false, error: null, pages: 1, total: 0,
  },
  reducers: {
    clearProductError: (state) => { state.error = null; },
    clearSelectedProduct: (state) => { state.selectedProduct = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProducts.fulfilled, (s, a) => { s.loading = false; s.products = a.payload.products; s.pages = a.payload.pages; s.total = a.payload.total; })
      .addCase(fetchProducts.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchProduct.pending, (s) => { s.loading = true; })
      .addCase(fetchProduct.fulfilled, (s, a) => { s.loading = false; s.selectedProduct = a.payload; })
      .addCase(fetchProduct.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchFeatured.fulfilled, (s, a) => { s.featured = a.payload; })
      .addCase(createProduct.fulfilled, (s, a) => {
        s.products.unshift(a.payload);
        if (a.payload?.isFeatured) {
          const exists = s.featured.find((p) => p._id === a.payload._id);
          if (!exists) s.featured.unshift(a.payload);
        }
      })
      .addCase(updateProduct.fulfilled, (s, a) => {
        const idx = s.products.findIndex((p) => p._id === a.payload._id);
        if (idx !== -1) s.products[idx] = a.payload;
        if (s.selectedProduct?._id === a.payload._id) s.selectedProduct = a.payload;

        const featuredIdx = s.featured.findIndex((p) => p._id === a.payload._id);
        if (a.payload?.isFeatured) {
          if (featuredIdx !== -1) s.featured[featuredIdx] = a.payload;
          else s.featured.unshift(a.payload);
        } else if (featuredIdx !== -1) {
          s.featured.splice(featuredIdx, 1);
        }
      })
      .addCase(deleteProduct.fulfilled, (s, a) => {
        s.products = s.products.filter((p) => p._id !== a.payload);
        s.featured = s.featured.filter((p) => p._id !== a.payload);
      });
  },
});

export const { clearProductError, clearSelectedProduct } = productSlice.actions;
export default productSlice.reducer;
