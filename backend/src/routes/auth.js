const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, role, language } = req.body;
    if (!name || !phone || !password || !role) {
      return res.status(400).json({ error: 'name, phone, password, role are required' });
    }
    if (!['farmer', 'buyer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const db = getDB();
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) return res.status(409).json({ error: 'Phone number already registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, name, phone, password_hash, role, language) VALUES (?,?,?,?,?,?)')
      .run(id, name, phone, hash, role, language || 'en');

    // Create profile for farmer/buyer
    if (role === 'farmer') {
      db.prepare('INSERT INTO farmer_profiles (id, user_id) VALUES (?,?)').run(uuidv4(), id);
    } else if (role === 'buyer') {
      db.prepare('INSERT INTO buyer_profiles (id, user_id) VALUES (?,?)').run(uuidv4(), id);
    }

    const token = jwt.sign({ id, name, phone, role }, process.env.JWT_SECRET || 'cgm_secret', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id, name, phone, role, language: language || 'en' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'phone and password required' });

    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE phone = ? AND active = 1').get(phone);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, name: user.name, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'cgm_secret',
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role, language: user.language } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, name, phone, role, language, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
