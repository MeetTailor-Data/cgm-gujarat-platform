const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/cgm_platform.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('farmer','buyer','admin')),
      language TEXT DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now')),
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS farmer_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
      village TEXT,
      taluka TEXT,
      district TEXT DEFAULT 'Saurashtra',
      state TEXT DEFAULT 'Gujarat',
      land_acres REAL,
      bank_account TEXT,
      ifsc_code TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS buyer_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
      company_name TEXT,
      gst_number TEXT,
      address TEXT,
      city TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS crop_listings (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL REFERENCES users(id),
      crop_type TEXT NOT NULL CHECK(crop_type IN ('cotton','groundnut')),
      quantity_quintals REAL NOT NULL,
      asking_price_per_quintal REAL,
      quality_grade TEXT CHECK(quality_grade IN ('A','B','C','unknown')) DEFAULT 'unknown',
      quality_notes TEXT,
      moisture_pct REAL,
      village TEXT,
      taluka TEXT,
      district TEXT,
      harvest_date TEXT,
      available_until TEXT,
      status TEXT DEFAULT 'available' CHECK(status IN ('available','sold','reserved','expired')),
      image_path TEXT,
      ai_quality_report TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS buyer_requirements (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL REFERENCES users(id),
      crop_type TEXT NOT NULL,
      quantity_quintals REAL NOT NULL,
      max_price_per_quintal REAL,
      min_quality TEXT DEFAULT 'B',
      preferred_district TEXT,
      preferred_taluka TEXT,
      required_by TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','closed','fulfilled')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL REFERENCES users(id),
      farmer_id TEXT NOT NULL REFERENCES users(id),
      listing_id TEXT NOT NULL REFERENCES crop_listings(id),
      requirement_id TEXT REFERENCES buyer_requirements(id),
      offered_price_per_quintal REAL NOT NULL,
      quantity_quintals REAL NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','expired','completed')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mandi_prices (
      id TEXT PRIMARY KEY,
      mandi_name TEXT NOT NULL,
      district TEXT NOT NULL,
      crop_type TEXT NOT NULL,
      min_price REAL,
      max_price REAL,
      modal_price REAL NOT NULL,
      arrivals_quintals REAL,
      price_date TEXT NOT NULL,
      source TEXT DEFAULT 'mock',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      offer_id TEXT REFERENCES offers(id),
      farmer_id TEXT NOT NULL REFERENCES users(id),
      buyer_id TEXT NOT NULL REFERENCES users(id),
      listing_id TEXT NOT NULL REFERENCES crop_listings(id),
      crop_type TEXT NOT NULL,
      quantity_quintals REAL NOT NULL,
      price_per_quintal REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'completed',
      completed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_logs (
      id TEXT PRIMARY KEY,
      agent TEXT NOT NULL,
      input_summary TEXT,
      output_summary TEXT,
      tokens_used INTEGER,
      latency_ms INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Database initialized');
  return db;
}

module.exports = { getDB, initDB };
