import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartDB } from '../../../services/cartDatabase';

let idCounter = 0;
const genId = () => `cart-${Date.now()}-${++idCounter}`;

export const loadCart = createAsyncThunk('cart/load', async () => {
  return await cartDB.getAll();
});

export const addToCart = createAsyncThunk('cart/add', async (item) => {
  return await cartDB.addItem({ ...item, id: genId() });
});

export const updateCartQty = createAsyncThunk('cart/updateQty', async ({ productId, quantity }) => {
  return await cartDB.updateQuantity(productId, quantity);
});

export const removeFromCart = createAsyncThunk('cart/remove', async (productId) => {
  return await cartDB.removeItem(productId);
});

export const clearCart = createAsyncThunk('cart/clear', async () => {
  return await cartDB.clearCart();
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    const setItems = (state, action) => {
      state.items = action.payload;
      state.loading = false;
    };
    builder
      .addCase(loadCart.pending, (state) => { state.loading = true; })
      .addCase(loadCart.fulfilled, setItems)
      .addCase(loadCart.rejected, (state) => { state.loading = false; })
      .addCase(addToCart.fulfilled, setItems)
      .addCase(updateCartQty.fulfilled, setItems)
      .addCase(removeFromCart.fulfilled, setItems)
      .addCase(clearCart.fulfilled, setItems);
  },
});

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
