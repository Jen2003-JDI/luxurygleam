import { configureStore } from '@reduxjs/toolkit';

// ── User Slices ───────────────────────────────────────────────────
import authReducer from './slices/user/authSlice';
import cartReducer from './slices/user/cartSlice';
import orderReducer from './slices/user/orderSlice';
import productReducer from './slices/user/productSlice';
import reviewReducer from './slices/user/reviewSlice';
import notificationReducer from './slices/user/notificationSlice';

// ── Admin Slices ──────────────────────────────────────────────────
import adminUserReducer from './slices/admin/adminUserSlice';
import analyticsReducer from './slices/admin/analyticsSlice';

const store = configureStore({
  reducer: {

    // User state
    auth: authReducer,
    cart: cartReducer,
    orders: orderReducer,
    products: productReducer,
    reviews: reviewReducer,
    notifications: notificationReducer,
    
    // Admin state
    adminUsers: adminUserReducer,
    analytics: analyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
