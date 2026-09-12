const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Multer setup for crop image uploads
const uploadDir = path.join(__dirname, '../../uploads/crops');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/farmer/profile
router.get('/profile', authMiddleware, requireRole('farmer'), (req, res) => {
  const db = getDB();
  const profile = db.prepare(`
    SELECT u.id, u.name, u.phone, u.language, fp.*
    FROM users u LEFT JOIN farmer_profiles fp ON fp.user_id = u.id
    WHERE u.id = ?
  `).get(req.user.id);
  res.json(profile);
});

// PUT /api/farmer/profile
router.put('/profile', authMiddleware, requireRole('farmer'), (req, res) => {
  const db = getDB();
  const { village, taluka, district, land_acres, bank_account, ifsc_code } = req.body;
  db.prepare(`
    UPDATE farmer_profiles SET village=?, taluka=?, district=?, land_acres=?, bank_account=?, ifsc_code=?
    WHERE user_id=?
  `).run(village, taluka, district, land_acres, bank_account, ifsc_code, req.user.id);
  db.prepare('UPDATE users SET name=? WHERE id=?').run(req.body.name || req.user.name, req.user.id);
  res.json({ success: true });
});

// GET /api/farmer/listings
router.get('/listings', authMiddleware, requireRole('farmer'), (req, res) => {
  const db = getDB();
  const listings = db.prepare('SELECT * FROM crop_listings WHERE farmer_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(listings);
});

// POST /api/farmer/listings
router.post('/listings', authMiddleware, requireRole('farmer'), upload.single('image'), (req, res) => {
  const db = getDB();
  const {
    crop_type, quantity_quintals, asking_price_per_quintal, quality_grade,
    quality_notes, moisture_pct, village, taluka, district, harvest_date, available_until
  } = req.body;

  if (!crop_type || !quantity_quintals) {
    return res.status(400).json({ error: 'crop_type and quantity_quintals are required' });
  }

  const id = uuidv4();
  const imagePath = req.file ? `/uploads/crops/${req.file.filename}` : null;

  db.prepare(`
    INSERT INTO crop_listings (id, farmer_id, crop_type, quantity_quintals, asking_price_per_quintal,
      quality_grade, quality_notes, moisture_pct, village, taluka, district,
      harvest_date, available_until, image_path)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, req.user.id, crop_type, quantity_quintals, asking_price_per_quintal,
    quality_grade || 'unknown', quality_notes, moisture_pct, village, taluka, district,
    harvest_date, available_until, imagePath);

  const listing = db.prepare('SELECT * FROM crop_listings WHERE id=?').get(id);
  res.status(201).json(listing);
});

// PUT /api/farmer/listings/:id
router.put('/listings/:id', authMiddleware, requireRole('farmer'), (req, res) => {
  const db = getDB();
  const { asking_price_per_quintal, quantity_quintals, status, quality_grade } = req.body;
  const listing = db.prepare('SELECT * FROM crop_listings WHERE id=? AND farmer_id=?').get(req.params.id, req.user.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  db.prepare(`
    UPDATE crop_listings SET asking_price_per_quintal=?, quantity_quintals=?, status=?, quality_grade=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    asking_price_per_quintal ?? listing.asking_price_per_quintal,
    quantity_quintals ?? listing.quantity_quintals,
    status ?? listing.status,
    quality_grade ?? listing.quality_grade,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM crop_listings WHERE id=?').get(req.params.id));
});

// GET /api/farmer/offers
router.get('/offers', authMiddleware, requireRole('farmer'), (req, res) => {
  const db = getDB();
  const offers = db.prepare(`
    SELECT o.*, u.name as buyer_name, bp.company_name, cl.crop_type, cl.quantity_quintals as listing_qty
    FROM offers o
    JOIN users u ON o.buyer_id = u.id
    LEFT JOIN buyer_profiles bp ON bp.user_id = o.buyer_id
    JOIN crop_listings cl ON o.listing_id = cl.id
    WHERE o.farmer_id = ? ORDER BY o.created_at DESC
  `).all(req.user.id);
  res.json(offers);
});

// POST /api/farmer/offers/:id/respond
router.post('/offers/:id/respond', authMiddleware, requireRole('farmer'), (req, res) => {
  const db = getDB();
  const { action } = req.body; // 'accept' or 'reject'
  if (!['accept', 'reject'].includes(action)) return res.status(400).json({ error: 'action must be accept or reject' });

  const offer = db.prepare('SELECT * FROM offers WHERE id=? AND farmer_id=?').get(req.params.id, req.user.id);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  if (offer.status !== 'pending') return res.status(400).json({ error: 'Offer is not pending' });

  const newStatus = action === 'accept' ? 'accepted' : 'rejected';
  db.prepare(`UPDATE offers SET status=?, updated_at=datetime('now') WHERE id=?`).run(newStatus, offer.id);

  if (action === 'accept') {
    // Create transaction
    const txId = uuidv4();
    const totalAmount = offer.offered_price_per_quintal * offer.quantity_quintals;
    db.prepare(`
      INSERT INTO transactions (id, offer_id, farmer_id, buyer_id, listing_id, crop_type, quantity_quintals, price_per_quintal, total_amount)
      SELECT ?, ?, ?, ?, ?, cl.crop_type, ?, ?, ?
      FROM crop_listings cl WHERE cl.id = ?
    `).run(txId, offer.id, offer.farmer_id, offer.buyer_id, offer.listing_id,
      offer.quantity_quintals, offer.offered_price_per_quintal, totalAmount, offer.listing_id);

    // Update listing status
    db.prepare(`UPDATE crop_listings SET status='sold', updated_at=datetime('now') WHERE id=?`).run(offer.listing_id);
  }

  res.json({ success: true, status: newStatus });
});

// GET /api/farmer/transactions
router.get('/transactions', authMiddleware, requireRole('farmer'), (req, res) => {
  const db = getDB();
  const txs = db.prepare(`
    SELECT t.*, u.name as buyer_name, bp.company_name
    FROM transactions t
    JOIN users u ON t.buyer_id = u.id
    LEFT JOIN buyer_profiles bp ON bp.user_id = t.buyer_id
    WHERE t.farmer_id=? ORDER BY t.completed_at DESC
  `).all(req.user.id);
  res.json(txs);
});

module.exports = router;
