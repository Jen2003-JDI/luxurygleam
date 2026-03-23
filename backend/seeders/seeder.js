// ─────────────────────────────────────────────────────────────────
//  Luxury Gleam — Database Seeder
//
//  Usage:
//    node seeders/seeder.js --import   → Seeds Admin, Users & Products
//    node seeders/seeder.js --destroy  → Wipes all seeded data
//
//  The seeder:
//    1. Creates 1 admin + 3 regular users (passwords hashed by model)
//    2. Creates 20 jewelry products assigned to the admin seller
//    3. Prints credentials to console for testing
// ─────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: require('path').join(__dirname, '../.env') });

const User    = require('../models/User');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const Review  = require('../models/Review');

const usersData   = require('./userData');
const productsData = require('./productData');

// ── Tiny colour helper (no extra dependency) ───────────────────────
function c(color, text) {
  const codes = { reset: '\x1b[0m', bright: '\x1b[1m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', magenta: '\x1b[35m' };
  return `${codes[color] || ''}${text}${codes.reset}`;
}

// ── Connect ────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(c('cyan', `\n✅ MongoDB Connected: ${conn.connection.host}`));
  } catch (err) {
    console.error(c('red', `❌ MongoDB Error: ${err.message}`));
    process.exit(1);
  }
};

// ── IMPORT ─────────────────────────────────────────────────────────
const importData = async () => {
  try {
    await connectDB();

    // Clear existing seeded data
    await Order.deleteMany();
    await Review.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log(c('yellow', '\n🗑️  Cleared existing data'));

    // ── Seed Users ──────────────────────────────────────────────
    // insertMany does not trigger pre-save hooks, so hash passwords explicitly.
    const usersWithHashedPasswords = await Promise.all(
      usersData.map(async (user) => ({
        ...user,
        password: user.password ? await bcrypt.hash(user.password, 10) : user.password,
      }))
    );
    const createdUsers = await User.insertMany(usersWithHashedPasswords);

    const adminUser = createdUsers.find((u) => u.role === 'admin');
    const regularUsers = createdUsers.filter((u) => u.role === 'user');

    console.log(c('green', `\n👑 Admin created:`));
    console.log(`   Name    : ${adminUser.name}`);
    console.log(`   Email   : ${adminUser.email}`);
    console.log(`   Password: Admin@1234`);
    console.log(`   ID      : ${adminUser._id}`);

    console.log(c('green', `\n👥 ${regularUsers.length} Users created:`));
    regularUsers.forEach((u, i) => {
      console.log(`   [${i + 1}] ${u.name} — ${u.email} (Password: User@1234)`);
    });

    // ── Seed Products ───────────────────────────────────────────
    // Assign the admin as seller for all products
    const productsWithSeller = productsData.map((p) => ({
      ...p,
      seller: adminUser._id,
    }));

    const createdProducts = await Product.insertMany(productsWithSeller);

    console.log(c('green', `\n💎 ${createdProducts.length} Products created:`));
    const byCategory = {};
    createdProducts.forEach((p) => {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    });
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} product(s)`);
    });

    const featured = createdProducts.filter((p) => p.isFeatured);
    console.log(`   Featured: ${featured.length} product(s)`);

    // ── Summary ─────────────────────────────────────────────────
    console.log(c('cyan', '\n════════════════════════════════════'));
    console.log(c('bright', '  ✅ Seeding Complete!'));
    console.log(c('cyan', '════════════════════════════════════'));
    console.log(`  Users    : ${createdUsers.length}`);
    console.log(`  Products : ${createdProducts.length}`);
    console.log(c('cyan', '════════════════════════════════════\n'));

    process.exit(0);
  } catch (err) {
    console.error(c('red', `\n❌ Seeding Error: ${err.message}`));
    console.error(err);
    process.exit(1);
  }
};

// ── DESTROY ────────────────────────────────────────────────────────
const destroyData = async () => {
  try {
    await connectDB();

    await Order.deleteMany();
    await Review.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log(c('red', '\n🗑️  All data destroyed successfully\n'));
    process.exit(0);
  } catch (err) {
    console.error(c('red', `\n❌ Destroy Error: ${err.message}`));
    process.exit(1);
  }
};

// ── Run ────────────────────────────────────────────────────────────
const arg = process.argv[2];
if (arg === '--import') {
  importData();
} else if (arg === '--destroy') {
  destroyData();
} else {
  console.log('\nUsage:');
  console.log('  node seeders/seeder.js --import   (seed data)');
  console.log('  node seeders/seeder.js --destroy  (wipe all data)\n');
  process.exit(0);
}
