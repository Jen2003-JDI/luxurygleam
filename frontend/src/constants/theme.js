// Luxury Gleam Design System — Dark Gold Luxury Theme
import Constants from 'expo-constants';

export const COLORS = {
  primary: '#C9A84C',       // Rich Gold
  primaryDark: '#A07830',   // Deep Gold
  primaryLight: '#E8CF82',  // Light Gold
  background: '#0D0600',    // Near-black warm
  surface: '#1A0E02',       // Dark surface
  surfaceLight: '#2A1E0A',  // Slightly lighter surface
  card: '#1F1408',          // Card background
  border: '#3A2A10',        // Border
  text: '#F5EDDA',          // Cream white
  textSecondary: '#B09060', // Muted gold
  textMuted: '#6B5030',     // Very muted
  error: '#E05252',
  success: '#52C478',
  warning: '#E0A830',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
  inputBg: '#241808',
  starFilled: '#C9A84C',
  starEmpty: '#3A2A10',
};

export const FONTS = {
  heading: 'serif',
  body: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Rings', value: 'Rings', icon: '💍' },
  { label: 'Necklaces', value: 'Necklaces', icon: '📿' },
  { label: 'Bracelets', value: 'Bracelets', icon: '✨' },
  { label: 'Earrings', value: 'Earrings', icon: '💎' },
  { label: 'Watches', value: 'Watches', icon: '⌚' },
  { label: 'Brooches', value: 'Brooches', icon: '🌸' },
  { label: 'Anklets', value: 'Anklets', icon: '🦋' },
  { label: 'Sets', value: 'Sets', icon: '👑' },
];

export const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'];

export const STATUS_COLORS = {
  Pending: '#E0A830',
  Processing: '#5B8DE0',
  Shipped: '#9B5BE0',
  'Out for Delivery': '#E07A30',
  Delivered: '#52C478',
  Cancelled: '#E05252',
  Refunded: '#808080',
};

const extraApiUrl = Constants.expoConfig?.extra?.API_URL;
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const hostUri =
  Constants.expoConfig?.hostUri ||
  Constants.manifest2?.extra?.expoGo?.debuggerHost ||
  Constants.manifest?.debuggerHost;

const normalizeHost = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // Handles values like:
  // - 192.168.1.10:8081
  // - exp://192.168.1.10:8081
  // - http://192.168.1.10:8081
  // - abc.ngrok.io:443
  const withoutScheme = raw.replace(/^[a-z]+:\/\//i, '');
  const withoutPath = withoutScheme.split('/')[0];
  const host = withoutPath.split(':')[0];
  return host || null;
};

const getInferredDevApiUrl = () => {
  const host = normalizeHost(hostUri);
  if (!host) return null;
  return `http://${host}:5000/api`;
};

const inferredDevApiUrl = getInferredDevApiUrl();
const extraApiUrlIsLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(String(extraApiUrl || ''));
const safeExtraApiUrl = extraApiUrlIsLocalhost ? null : extraApiUrl;
const renderApiUrl = 'https://luxurygleam.onrender.com/api';

export const API_URL = envApiUrl || safeExtraApiUrl || renderApiUrl || inferredDevApiUrl || extraApiUrl || 'http://localhost:5000/api';
