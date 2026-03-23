const express = require('express');
const router = express.Router();
// Cart is managed client-side via SQLite / AsyncStorage.
// This route exists for any server-side cart sync if needed in the future.
router.get('/ping', (req, res) => res.json({ success: true, message: 'Cart is device-local (SQLite)' }));
module.exports = router;
