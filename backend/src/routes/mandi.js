const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/mandi/prices
router.get('/prices', authMiddleware, (req, res) => {
  const db = getDB();
  const { crop_type, district, days = 30 } = req.query;

  let query = `
    SELECT * FROM mandi_prices
    WHERE price_date >= date('now', '-' || ? || ' days')
  `;
  const params = [days];

  if (crop_type) { query += ' AND crop_type = ?'; params.push(crop_type); }
  if (district) { query += ' AND district = ?'; params.push(district); }
  query += ' ORDER BY price_date DESC, mandi_name';

  res.json(db.prepare(query).all(...params));
});

// GET /api/mandi/latest
router.get('/latest', authMiddleware, (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT m1.* FROM mandi_prices m1
    INNER JOIN (
      SELECT mandi_name, crop_type, MAX(price_date) as max_date
      FROM mandi_prices GROUP BY mandi_name, crop_type
    ) m2 ON m1.mandi_name = m2.mandi_name AND m1.crop_type = m2.crop_type AND m1.price_date = m2.max_date
    ORDER BY m1.district, m1.mandi_name
  `).all();
  res.json(rows);
});

// GET /api/mandi/districts
router.get('/districts', authMiddleware, (req, res) => {
  const db = getDB();
  const districts = db.prepare('SELECT DISTINCT district FROM mandi_prices ORDER BY district').all();
  res.json(districts.map(d => d.district));
});

// GET /api/mandi/summary
router.get('/summary', authMiddleware, (req, res) => {
  const db = getDB();
  const summary = db.prepare(`
    SELECT crop_type,
      ROUND(AVG(modal_price),0) as avg_price,
      MAX(modal_price) as max_price,
      MIN(modal_price) as min_price,
      MAX(price_date) as latest_date
    FROM mandi_prices
    WHERE price_date >= date('now', '-7 days')
    GROUP BY crop_type
  `).all();
  res.json(summary);
});

module.exports = router;
