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
    │   │   │   └── AdminOrdersScreen.js  # Status update + push notification
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
| 5 | Transaction + Push Notification | `AdminOrdersScreen` updates status → backend calls Expo Push API → user receives notification → tap opens `OrderDetailScreen` |
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

## 🌐 Step-by-Step Deployment Guide

### A) Backend Deployment to Vercel (Step-by-Step)

1. Install Vercel CLI and login.

```bash
npm i -g vercel
vercel login
```

2. Go to backend folder.

```bash
cd backend
```

3. Deploy backend project.

```bash
vercel
```

4. During prompts, use these values:
- Set up and deploy: Yes
- Scope: your account/team
- Link to existing project: No (or Yes if already created)
- Project name: luxurygleam-backend (or preferred name)
- In which directory is your code located: .

5. Add environment variables in Vercel dashboard:

```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secret
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NODE_ENV=production
```

6. Redeploy after adding env vars.

```bash
vercel --prod
```

7. Verify backend health endpoint.

```bash
https://your-backend-project.vercel.app/api/health
```

### B) Backend Deployment to Render (Step-by-Step)

Option 1 (recommended): Use render.yaml blueprint from repo root.

1. Push latest code to GitHub.

```bash
git add .
git commit -m "prepare deployment"
git push
```

2. Open Render dashboard -> New -> Blueprint.

3. Connect your GitHub repo and select this project.

4. Render will detect render.yaml automatically. Confirm service settings:
- Root Directory: backend
- Build Command: npm install
- Start Command: npm start
- Health Check Path: /api/health

5. Add required environment variables:

```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secret
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NODE_ENV=production
```

6. Deploy and wait until status becomes Live.

7. Verify backend health endpoint.

```bash
https://your-render-service.onrender.com/api/health
```

### C) Frontend APK Deployment (Expo EAS Build)

1. Go to frontend folder and install dependencies.

```bash
cd frontend
npm install
```

2. Ensure backend API URL is production URL (Render or Vercel):

```bash
# Windows PowerShell (temporary for current terminal)
$env:EXPO_PUBLIC_API_URL="https://your-render-service.onrender.com/api"

# macOS/Linux (temporary for current terminal)
export EXPO_PUBLIC_API_URL="https://your-render-service.onrender.com/api"
```

3. Login to Expo and initialize EAS (one-time setup).

```bash
npx expo login
npx eas login
npx eas init
```

4. Generate Android keystore (first build only).

```bash
npx eas credentials
```

5. Build APK using APK profile.

```bash
npx eas build --platform android --profile production-apk
```

6. If build fails with lock-file warning, generate and commit lock file then rebuild.

```bash
npm install
git add -f package-lock.json
git commit -m "add lock file for eas build"
git push
npx eas build --platform android --profile production-apk
```

7. Open the build URL from terminal, download APK, then install on Android device.

8. Optional: Check latest build status.

```bash
npx eas build:list --platform android --limit 5
```

### D) Frontend Local Run (Expo Go)

```bash
cd frontend
npm install
npx expo start
```

Scan QR using Expo Go.

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
