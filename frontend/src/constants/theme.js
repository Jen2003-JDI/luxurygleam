// Luxury Gleam Design System — Dark Gold Luxury Theme
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

export const API_URL = 'http://10.122.119.26:5000/api'; // Change to your server IP/port
//export const API_URL = 'http://196.168.100.58:5000/api'; // Change to your server IP/port
