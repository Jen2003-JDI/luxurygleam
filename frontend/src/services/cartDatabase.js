import * as SQLite from 'expo-sqlite';

let db = null;

const getDb = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('luxury_gleam_cart.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cart (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        stock INTEGER NOT NULL DEFAULT 0,
        addedAt TEXT NOT NULL
      );
    `);
  }
  return db;
};

export const cartDB = {
  getAll: async () => {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM cart ORDER BY addedAt DESC');
  },

  addItem: async (item) => {
    const db = await getDb();
    const existing = await db.getFirstAsync('SELECT * FROM cart WHERE productId = ?', [item.productId]);
    if (existing) {
      const newQty = Math.min(existing.quantity + item.quantity, item.stock);
      await db.runAsync('UPDATE cart SET quantity = ? WHERE productId = ?', [newQty, item.productId]);
    } else {
      await db.runAsync(
        'INSERT INTO cart (id, productId, name, price, image, quantity, stock, addedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [item.id, item.productId, item.name, item.price, item.image, item.quantity, item.stock, new Date().toISOString()]
      );
    }
    return await cartDB.getAll();
  },

  updateQuantity: async (productId, quantity) => {
    const db = await getDb();
    if (quantity <= 0) {
      await db.runAsync('DELETE FROM cart WHERE productId = ?', [productId]);
    } else {
      await db.runAsync('UPDATE cart SET quantity = ? WHERE productId = ?', [quantity, productId]);
    }
    return await cartDB.getAll();
  },

  removeItem: async (productId) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM cart WHERE productId = ?', [productId]);
    return await cartDB.getAll();
  },

  clearCart: async () => {
    const db = await getDb();
    await db.runAsync('DELETE FROM cart');
    return [];
  },

  getCount: async () => {
    const db = await getDb();
    const result = await db.getFirstAsync('SELECT SUM(quantity) as total FROM cart');
    return result?.total || 0;
  },
};
