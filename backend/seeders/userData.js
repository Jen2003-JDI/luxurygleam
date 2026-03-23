// ─── User Seed Data ──────────────────────────────────────────────
// Passwords will be hashed by the User model's pre-save hook.
// DO NOT store plain-text passwords in production.

const users = [
  // ── Admin Account ──────────────────────────────────────────────
  {
    name: 'Luxury Gleam Admin',
    email: 'admin@luxurygleam.com',
    password: 'Admin@1234',
    role: 'admin',
    phone: '+63 912 345 6789',
    address: {
      street: '123 Jewelry District, BGC',
      city: 'Taguig',
      state: 'Metro Manila',
      zip: '1634',
      country: 'Philippines',
    },
    authProvider: 'local',
    isActive: true,
  },

  // ── Regular User Accounts ──────────────────────────────────────
  {
    name: 'Maria Santos',
    email: 'maria.santos@gmail.com',
    password: 'User@1234',
    role: 'user',
    phone: '+63 917 123 4567',
    address: {
      street: '45 Rizal Avenue',
      city: 'Makati',
      state: 'Metro Manila',
      zip: '1200',
      country: 'Philippines',
    },
    authProvider: 'local',
    isActive: true,
  },
  {
    name: 'Juan dela Cruz',
    email: 'juan.delacruz@yahoo.com',
    password: 'User@1234',
    role: 'user',
    phone: '+63 918 765 4321',
    address: {
      street: '7 Bonifacio Street',
      city: 'Quezon City',
      state: 'Metro Manila',
      zip: '1100',
      country: 'Philippines',
    },
    authProvider: 'local',
    isActive: true,
  },
  {
    name: 'Ana Reyes',
    email: 'ana.reyes@email.com',
    password: 'User@1234',
    role: 'user',
    phone: '+63 919 234 5678',
    address: {
      street: '22 Aguinaldo Highway',
      city: 'Cavite',
      state: 'Calabarzon',
      zip: '4100',
      country: 'Philippines',
    },
    authProvider: 'local',
    isActive: true,
  },
];

module.exports = users;
