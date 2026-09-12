const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/buyer/profile
router.get('/profile', authMiddleware, requireRole('buyer'), (req, res) => {
  const db = getDB();
  const profile = db.prepare(`
    SELECT u.id, u.name, u.phone, u.language, bp.*
    FROM users u LEFT JOIN buyer_profiles bp ON bp.user_id = u.id
    WHERE u.id = ?
  `).get(req.user.id);
  res.json(profile);
});

// PUT /api/buyer/profile
router.put('/profile', authMiddleware, requireRole('buyer'), (req, res) => {
  const db = getDB();
  const { company_name, gst_number, address, city } = req.body;
  db.prepare('UPDATE buyer_profiles SET company_name=?, gst_number=?, address=?, city=? WHERE user_id=?')
    .run(company_name, gst_number, address, city, req.user.id);
  if (req.body.name) db.prepare('UPDATE users SET name=? WHERE id=?').run(req.body.name, req.user.id);
  res.json({ success: true });
});

// GET /api/buyer/requirements
router.get('/requirements', authMiddleware, requireRole('buyer'), (req, res) => {
  const db = getDB();
  const reqs = db.prepare('SELECT * FROM buyer_requirements WHERE buyer_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(reqs);
});

// POST /api/buyer/requirements
router.post('/requirements', authMiddleware, requireRole('buyer'), (req, res) => {
  const db = getDB();
  const { crop_type, quantity_quintals, max_price_per_quintal, min_quality, preferred_district, preferred_taluka, required_by, notes } = req.body;
  if (!crop_type || !quantity_quintals) return res.status(400).json({ error: 'crop_type and quantity_quintals required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO buyer_requirements (id, buyer_id, crop_type, quantity_quintals, max_price_per_quintal, min_quality, preferred_district, preferred_taluka, required_by, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(id, req.user.id, crop_type, quantity_quintals, max_price_per_quintal, min_quality || 'B', preferred_district, preferred_taluka, required_by, notes);

  res.status(201).json(db.prepare('SELECT * FROM buyer_requirements WHERE id=?').get(id));
});

// GET /api/buyer/listings - browse available farmer listings
router.get('/listings', authMiddleware, requireRole('buyer'), (req, res) => {
  const db = getDB();
  const { crop_type, district, min_quality, max_price } = req.query;

  let query = `
    SELECT cl.*, u.name as farmer_name, fp.village, fp.taluka
    FROM crop_listings cl
    JOIN users u ON cl.farmer_id = u.id
    LEFT JOIN farmer_profiles fp ON fp.user_id = cl.farmer_id
    WHERE cl.status = 'available'
  `;
  const params = [];

  if (crop_type) { query += ' AND cl.crop_type = ?'; params.push(crop_type); }
  if (district) { query += ' AND cl.district = ?'; params.push(district); }
  if (max_price) { query += ' AND (cl.asking_price_per_quintal IS NULL OR cl.asking_price_per_quintal <= ?)'; params.push(max_price); }
  if (min_quality) {
    const grades = { A: ['A'], B: ['A','B'], C: ['A','B','C'] };
    const allowed = grades[min_quality] || ['A','B','C','unknown'];
    query += ` AND cl.quality_grade IN (${allowed.map(() => '?').join(',')})`;
    params.push(...allowed);
  }
  query += ' ORDER BY cl.created_at DESC';

  res.json(db.prepare(query).all(...params));
});

// POST /api/buyer/offers
router.post('/offers', authMiddleware, requireRole('buyer'), (req, res) => {
  const db = getDB();
  const { listing_id, requirement_id, offered_price_per_quintal, quantity_quintals, message } = req.body;
  if (!listing_id || !offered_price_per_quintal || !quantity_quintals) {
    return res.status(400).json({ error: 'listing_id, offered_price_per_quintal, quantity_quintals required' });
  }

  const listing = db.prepare('SELECT * FROM crop_listings WHERE id=? AND status=?').get(listing_id, 'available');
  if (!listing) return res.status(404).json({ error: 'Listing not available' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO offers (id, buyer_id, farmer_id, listing_id, requirement_id, offered_price_per_quintal, quantity_quintals, message)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(id, req.user.id, listing.farmer_id, listing_id, requirement_id || null,
    offered_price_per_quintal, quantity_quintals, message);

  res.status(201).json(db.prepare('SELECT * FROM offers WHERE id=?').get(id));
});

// GET /api/buyer/offers
router.get('/offers', authMiddleware, requireRole('buyer'), (req, res) => {
  const db = getDB();
  const offers = db.prepare(`
    SELECT o.*, u.name as farmer_name, fp.village, fp.district as farmer_district, cl.crop_type
    FROM offers o
    JOIN users u ON o.farmer_id = u.id
    LEFT JOIN farmer_profiles fp ON fp.user_id = o.farmer_id
    JOIN crop_listings cl ON o.listing_id = cl.id
    WHERE o.buyer_id=? ORDER BY o.created_at DESC
  `).all(req.user.id);
  res.json(offers);
});

// GET /api/buyer/transactions
router.get('/transactions', authMiddleware, requireRole('buyer'), (req, res) => {
  const db = getDB();
  const txs = db.prepare(`
    SELECT t.*, u.name as farmer_name FROM transactions t
    JOIN users u ON t.farmer_id = u.id
    WHERE t.buyer_id=? ORDER BY t.completed_at DESC
  `).all(req.user.id);
  res.json(txs);
});

module.exports = router;
