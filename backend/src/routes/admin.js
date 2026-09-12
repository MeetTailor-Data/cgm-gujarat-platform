const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All admin routes require admin role
router.use(authMiddleware, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const db = getDB();
  const stats = {
    farmers: db.prepare("SELECT COUNT(*) as c FROM users WHERE role='farmer' AND active=1").get().c,
    buyers: db.prepare("SELECT COUNT(*) as c FROM users WHERE role='buyer' AND active=1").get().c,
    listings: db.prepare("SELECT COUNT(*) as c FROM crop_listings WHERE status='available'").get().c,
    transactions: db.prepare('SELECT COUNT(*) as c FROM transactions').get().c,
    total_volume: db.prepare('SELECT COALESCE(SUM(total_amount),0) as v FROM transactions').get().v,
    pending_offers: db.prepare("SELECT COUNT(*) as c FROM offers WHERE status='pending'").get().c,
    cotton_listings: db.prepare("SELECT COUNT(*) as c FROM crop_listings WHERE crop_type='cotton' AND status='available'").get().c,
    groundnut_listings: db.prepare("SELECT COUNT(*) as c FROM crop_listings WHERE crop_type='groundnut' AND status='available'").get().c,
  };
  res.json(stats);
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const db = getDB();
  const { role, page = 1, limit = 20 } = req.query;
  let query = 'SELECT id, name, phone, role, language, created_at, active FROM users';
  const params = [];
  if (role) { query += ' WHERE role=?'; params.push(role); }
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  res.json(db.prepare(query).all(...params));
});

// POST /api/admin/users/:id/toggle
router.post('/users/:id/toggle', (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT active FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.prepare('UPDATE users SET active=? WHERE id=?').run(user.active ? 0 : 1, req.params.id);
  res.json({ success: true, active: !user.active });
});

// GET /api/admin/listings
router.get('/listings', (req, res) => {
  const db = getDB();
  const listings = db.prepare(`
    SELECT cl.*, u.name as farmer_name, u.phone as farmer_phone
    FROM crop_listings cl JOIN users u ON cl.farmer_id = u.id
    ORDER BY cl.created_at DESC LIMIT 100
  `).all();
  res.json(listings);
});

// GET /api/admin/transactions
router.get('/transactions', (req, res) => {
  const db = getDB();
  const txs = db.prepare(`
    SELECT t.*, f.name as farmer_name, b.name as buyer_name
    FROM transactions t
    JOIN users f ON t.farmer_id = f.id
    JOIN users b ON t.buyer_id = b.id
    ORDER BY t.completed_at DESC
  `).all();
  res.json(txs);
});

// POST /api/admin/mandi
router.post('/mandi', (req, res) => {
  const db = getDB();
  const { v4: uuidv4 } = require('uuid');
  const { mandi_name, district, crop_type, min_price, max_price, modal_price, arrivals_quintals, price_date } = req.body;
  if (!mandi_name || !crop_type || !modal_price || !price_date) {
    return res.status(400).json({ error: 'mandi_name, crop_type, modal_price, price_date required' });
  }
  const id = uuidv4();
  db.prepare(`
    INSERT INTO mandi_prices (id, mandi_name, district, crop_type, min_price, max_price, modal_price, arrivals_quintals, price_date, source)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(id, mandi_name, district, crop_type, min_price, max_price, modal_price, arrivals_quintals, price_date, 'admin');
  res.status(201).json({ success: true, id });
});

// GET /api/admin/ai-logs
router.get('/ai-logs', (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM ai_logs ORDER BY created_at DESC LIMIT 50').all());
});

module.exports = router;
