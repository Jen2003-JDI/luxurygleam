# 💎 Luxury Gleam — Fine Jewelry E-Commerce App

A full-stack, production-ready jewelry e-commerce mobile app built with **Expo Go / React Native** (frontend) and **Node.js + MongoDB** (backend).

---

## 📱 App Preview

Dark gold luxury theme with a rich, premium aesthetic. Features a custom drawer navigator, bottom tabs, and polished UI throughout.

---

## 🏗️ Project Structure

```
luxury-gleam/
├── backend/                  # Node.js + Express + MongoDB API
│   ├── config/
│   │   ├── cloudinary.js     # Image upload middleware
│   │   └── pushNotification.js  # Expo push notification service
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── reviewController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT protect & admin guard
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── userRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/                 # Expo Go / React Native App
    ├── App.js                # Root entry
    ├── app.json              # Expo config
    ├── src/
    │   ├── constants/
    │   │   └── theme.js      # Colors, fonts, spacing, categories
    │   ├── services/
    │   │   ├── api.js         # Axios + JWT interceptor
    │   │   ├── cartDatabase.js  # SQLite cart operations
    │   │   └── notificationService.js  # Expo push token registration
    │   ├── redux/
    │   │   ├── store.js
    │   │   └── slices/
    │   │       ├── authSlice.js
    │   │       ├── productSlice.js
    │   │       ├── cartSlice.js      # SQLite-backed cart
    │   │       ├── orderSlice.js
    │   │       ├── reviewSlice.js
    │   │       └── notificationSlice.js
    │   ├── navigation/
    │   │   ├── RootNavigator.js
    │   │   ├── AuthNavigator.js
    │   │   ├── DrawerNavigator.js    # Custom gold drawer
    │   │   └── MainTabNavigator.js
    │   ├── screens/
    │   │   ├── auth/
    │   │   │   ├── LoginScreen.js
    │   │   │   └── RegisterScreen.js
    │   │   ├── product/
    │   │   │   ├── HomeScreen.js
    │   │   │   ├── ProductDetailScreen.js
    │   │   │   └── AdminProductsScreen.js  # Full CRUD + camera/gallery
    │   │   ├── search/
    │   │   │   └── SearchScreen.js    # Filters by category + price range
    │   │   ├── cart/
    │   │   │   ├── CartScreen.js       # Swipe-to-delete, SQLite
    │   │   │   └── CheckoutScreen.js
    │   │   ├── order/
    │   │   │   ├── OrdersScreen.js
    │   │   │   ├── OrderDetailScreen.js  # Progress tracker
    │   │   │   ├── OrderSuccessScreen.js
    │   │   │   └── AdminOrdersScreen.js  # Status update + push notif
    │   │   ├── profile/
    │   │   │   └── ProfileScreen.js   # Photo upload, address
    │   │   ├── review/
    │   │   │   └── WriteReviewScreen.js  # Verified purchase only
    │   │   └── notification/
    │   │       └── NotificationsScreen.js
    │   └── components/
    │       ├── product/
    │       │   └── ProductCard.js
    │       └── ui/
    │           ├── ScreenHeader.js
    │           ├── StarRating.js
    │           └── ToastConfig.js
    └── package.json
```

---

## ✅ Functional Requirements Coverage

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | Product/Service CRUD | `AdminProductsScreen` + backend CRUD endpoints. Camera + gallery via `expo-image-picker`, uploads to **Cloudinary** |
| 2 | User Login/Register + Social | `LoginScreen`, `RegisterScreen`, social login via `/api/auth/social`. Avatar upload with camera/gallery. JWT stored in **Expo SecureStore** |
| 3 | Review & Ratings | `WriteReviewScreen` — verified purchase check, star rating 1–5, image upload, update own review |
| 4 | SQLite Cart | `cartDatabase.js` using `expo-sqlite`. Cart loads on app open, persists until checkout clears it |
| 5 | Transaction + Push Notif | `AdminOrdersScreen` updates status → backend calls Expo Push API → user receives notification → tap opens `OrderDetailScreen` |
| 6 | Search + Filters | `SearchScreen` — keyword search, filter by category + price range (min/max), sort by newest/price/rating |
| 7 | Promo Notifications | Admin sends global promo from `AdminOrdersScreen` → all users get push notification |
| 8 | Redux | Applied to orders (`orderSlice`), products (`productSlice`), reviews (`reviewSlice`), cart, auth, notifications |
| 9 | Drawer UI | Custom gold-themed `DrawerNavigator` with avatar, role badge, admin menu items |
| 10 | Node Backend + JWT | Express API with JWT auth, tokens stored in **Expo SecureStore** on frontend, MongoDB via Mongoose |
| 11 | Push Token Management | Token saved to User model on login, removed on logout, stale tokens (DeviceNotRegistered) purged automatically |

---

## 🚀 Setup Instructions

### Backend

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, Cloudinary keys, JWT secret

npm run dev   # starts on port 5000
```

### Frontend

```bash
cd frontend
npm install

# Update API_URL in src/constants/theme.js to your server's local IP:
# export const API_URL = 'http://YOUR_LOCAL_IP:5000/api';

npx expo start
```

Scan the QR code with **Expo Go** on your phone (must be on the same WiFi network as your development machine).

---

## 🔧 Environment Variables (backend/.env)

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secret
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo-sqlite` | Local SQLite cart storage |
| `expo-secure-store` | JWT token storage |
| `expo-notifications` | Push notifications |
| `expo-image-picker` | Camera + gallery |
| `@reduxjs/toolkit` + `react-redux` | State management |
| `@react-navigation/drawer` | Drawer navigator |
| `react-native-swipe-list-view` | Swipe-to-delete cart |
| `cloudinary` | Product & avatar image hosting |
| `expo-server-sdk` | Send Expo push notifications from backend |
| `mongoose` | MongoDB ODM |

---

## 👑 Admin Features

To make a user an admin, update their role in MongoDB:
```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

Admin users get extra drawer menu items:
- **Manage Products** — Create, edit, delete products with photo upload
- **Manage Orders** — Update order status, send promo push notifications

---

## 💎 Design System

- **Primary**: `#C9A84C` Rich Gold
- **Background**: `#0D0600` Near-black warm
- **Theme**: Dark luxury, gold accents, cream text
- **Typography**: System serif for headings, clean body text

---

## 📲 Push Notification Flow

1. User logs in → `registerForPushNotifications()` called
2. Expo push token saved to user's `expoPushTokens[]` array in MongoDB
3. Admin updates order status → backend calls `expo-server-sdk`
4. User receives notification on device
5. Tapping notification navigates to `OrderDetailScreen`
6. On logout, token removed from DB
7. Stale/invalid tokens auto-purged (`DeviceNotRegistered` error handling)

---

## 🌱 Database Seeder

Quickly populate the database with initial data for development and testing.

### Seed Data Includes

| Type | Count | Details |
|------|-------|---------|
| Admin | 1 | `admin@luxurygleam.com` / `Admin@1234` |
| Users | 3 | `maria.santos@gmail.com`, `juan.delacruz@yahoo.com`, `ana.reyes@email.com` (all: `User@1234`) |
| Products | 18 | Across all 8 categories: Rings, Necklaces, Bracelets, Earrings, Watches, Brooches, Anklets, Sets |

### Run the Seeder

```bash
cd backend

# Import seed data (creates Admin + Users + Products)
npm run seed

# Or destroy all data (wipe entire database)
npm run seed:destroy
```

### Manual run
```bash
node seeders/seeder.js --import    # seed
node seeders/seeder.js --destroy   # wipe
```

### ⚠️ Important Notes
- Run `npm run seed` **after** setting up `.env` with your MongoDB URI
- The seeder **wipes all existing** Users, Products, Orders, and Reviews before seeding
- Passwords are hashed automatically by the User model's `pre-save` hook
- All products are assigned to the Admin user as seller
- Product images use placeholder URLs — replace with real Cloudinary URLs in production
