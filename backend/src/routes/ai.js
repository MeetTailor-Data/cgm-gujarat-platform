const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const { mandiPriceForecast } = require('../agents/mandiForecasting');
const { matchBuyerFarmer } = require('../agents/buyerFarmerMatching');
const { storageSellingAdvisor } = require('../agents/storageAdvisor');
const { qualityGradingAgent } = require('../agents/qualityGrading');
const { incomeDashboardAgent } = require('../agents/incomeDashboard');
const { getDB } = require('../db/database');

// Multer for quality image upload
const uploadDir = path.join(__dirname, '../../uploads/quality');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 5 * 1024 * 1024 } });

function logAI(agent, inputSummary, outputSummary) {
  try {
    const db = getDB();
    db.prepare('INSERT INTO ai_logs (id, agent, input_summary, output_summary) VALUES (?,?,?,?)')
      .run(uuidv4(), agent, inputSummary, outputSummary);
  } catch {}
}

// POST /api/ai/forecast
router.post('/forecast', authMiddleware, async (req, res) => {
  try {
    const { crop_type, district } = req.body;
    if (!crop_type) return res.status(400).json({ error: 'crop_type required' });
    const result = await mandiPriceForecast({ cropType: crop_type, district });
    logAI('mandiForecasting', `${crop_type}/${district}`, result.recommendation);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/match
router.post('/match', authMiddleware, async (req, res) => {
  try {
    const { requirement_id } = req.body;
    if (!requirement_id) return res.status(400).json({ error: 'requirement_id required' });
    const result = await matchBuyerFarmer({ requirementId: requirement_id, buyerId: req.user.id });
    logAI('buyerFarmerMatching', `req:${requirement_id}`, `${result.total_found} matches`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/storage-advice
router.post('/storage-advice', authMiddleware, async (req, res) => {
  try {
    const { crop_type, district, quantity, current_price, storage_type } = req.body;
    if (!crop_type || !quantity || !current_price) {
      return res.status(400).json({ error: 'crop_type, quantity, current_price required' });
    }
    const result = await storageSellingAdvisor({ cropType: crop_type, district, quantity, currentPrice: current_price, storageType: storage_type });
    logAI('storageAdvisor', `${crop_type}/${quantity}qtl@₹${current_price}`, result.recommendation);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/quality-grade
router.post('/quality-grade', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { crop_type, manual_notes } = req.body;
    if (!crop_type) return res.status(400).json({ error: 'crop_type required' });
    const imagePath = req.file?.path || null;
    const result = await qualityGradingAgent({ imagePath, cropType: crop_type, manualNotes: manual_notes });
    logAI('qualityGrading', `${crop_type}`, `Grade ${result.grade} (${result.confidence}%)`);

    // Update listing if listing_id provided
    if (req.body.listing_id) {
      const db = getDB();
      db.prepare(`UPDATE crop_listings SET quality_grade=?, ai_quality_report=?, updated_at=datetime('now') WHERE id=? AND farmer_id=?`)
        .run(result.grade, JSON.stringify(result), req.body.listing_id, req.user.id);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/income-dashboard
router.get('/income-dashboard', authMiddleware, async (req, res) => {
  try {
    const result = await incomeDashboardAgent({ farmerId: req.user.id });
    logAI('incomeDashboard', `farmer:${req.user.id}`, JSON.stringify(result.summary));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
