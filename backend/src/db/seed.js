/**
 * Demo seed data for CGM Gujarat Platform
 * Generates realistic mock data for testing
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { initDB, getDB } = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const GUJARAT_MANDIS = [
  { name: 'Rajkot APMC', district: 'Rajkot' },
  { name: 'Gondal APMC', district: 'Rajkot' },
  { name: 'Junagadh APMC', district: 'Junagadh' },
  { name: 'Bhavnagar APMC', district: 'Bhavnagar' },
  { name: 'Amreli APMC', district: 'Amreli' },
  { name: 'Jamnagar APMC', district: 'Jamnagar' },
  { name: 'Surendranagar APMC', district: 'Surendranagar' },
  { name: 'Morbi APMC', district: 'Morbi' },
];

const SAMPLE_FARMERS = [
  { name: 'Ramesh Patel', phone: '9876543210', village: 'Kotda', taluka: 'Gondal', district: 'Rajkot', land: 12 },
  { name: 'Bhavesh Mer', phone: '9876543211', village: 'Upleta', taluka: 'Upleta', district: 'Rajkot', land: 8 },
  { name: 'Haresh Solanki', phone: '9876543212', village: 'Keshod', taluka: 'Keshod', district: 'Junagadh', land: 15 },
  { name: 'Dinesh Koli', phone: '9876543213', village: 'Mahuva', taluka: 'Mahuva', district: 'Bhavnagar', land: 6 },
  { name: 'Kantibhai Vala', phone: '9876543214', village: 'Bagasara', taluka: 'Bagasara', district: 'Amreli', land: 20 },
  { name: 'Jayesh Nakum', phone: '9876543215', village: 'Jodiya', taluka: 'Jodiya', district: 'Jamnagar', land: 10 },
];

const SAMPLE_BUYERS = [
  { name: 'Ashok Cotton Traders', phone: '9876500001', company: 'Ashok Cotton Pvt Ltd', city: 'Ahmedabad', gst: '24AABCA1234F1ZP' },
  { name: 'Saurashtra Oil Mills', phone: '9876500002', company: 'Saurashtra Oil Mill Pvt Ltd', city: 'Rajkot', gst: '24BBBCS9876G1ZQ' },
  { name: 'Gujarat Agro Exports', phone: '9876500003', company: 'Gujarat Agro Exports Ltd', city: 'Surat', gst: '24CCCEA5678H1ZR' },
];

async function seed() {
  initDB();
  const db = getDB();

  // Clear existing data
  db.exec(`
    DELETE FROM ai_logs; DELETE FROM transactions; DELETE FROM offers;
    DELETE FROM buyer_requirements; DELETE FROM crop_listings;
    DELETE FROM buyer_profiles; DELETE FROM farmer_profiles; DELETE FROM users;
    DELETE FROM mandi_prices;
  `);

  const hash = await bcrypt.hash('password123', 10);

  // Admin
  const adminId = uuidv4();
  db.prepare('INSERT INTO users (id, name, phone, password_hash, role) VALUES (?,?,?,?,?)')
    .run(adminId, 'Admin User', '9000000000', hash, 'admin');

  // Farmers
  const farmerIds = [];
  for (const f of SAMPLE_FARMERS) {
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, name, phone, password_hash, role, language) VALUES (?,?,?,?,?,?)')
      .run(id, f.name, f.phone, hash, 'farmer', 'gu');
    const fpId = uuidv4();
    db.prepare('INSERT INTO farmer_profiles (id, user_id, village, taluka, district, land_acres) VALUES (?,?,?,?,?,?)')
      .run(fpId, id, f.village, f.taluka, f.district, f.land);
    farmerIds.push({ id, ...f });
  }

  // Buyers
  const buyerIds = [];
  for (const b of SAMPLE_BUYERS) {
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, name, phone, password_hash, role) VALUES (?,?,?,?,?)')
      .run(id, b.name, b.phone, hash, 'buyer');
    const bpId = uuidv4();
    db.prepare('INSERT INTO buyer_profiles (id, user_id, company_name, gst_number, city) VALUES (?,?,?,?,?)')
      .run(bpId, id, b.company, b.gst, b.city);
    buyerIds.push({ id, ...b });
  }

  // Mandi prices — 30 days historical data
  const today = new Date();
  for (const mandi of GUJARAT_MANDIS) {
    let cottonBase = 6000 + Math.random() * 400;
    let groundnutBase = 5200 + Math.random() * 600;
    for (let d = 30; d >= 0; d--) {
      const date = new Date(today); date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      cottonBase += (Math.random() - 0.48) * 80;
      groundnutBase += (Math.random() - 0.46) * 70;

      const cottonModal = Math.round(cottonBase);
      const groundnutModal = Math.round(groundnutBase);

      db.prepare(`
        INSERT INTO mandi_prices (id, mandi_name, district, crop_type, min_price, max_price, modal_price, arrivals_quintals, price_date, source)
        VALUES (?,?,?,?,?,?,?,?,?,?)
      `).run(uuidv4(), mandi.name, mandi.district, 'cotton',
        Math.round(cottonModal * 0.96), Math.round(cottonModal * 1.04), cottonModal,
        Math.round(200 + Math.random() * 500), dateStr, 'mock');

      db.prepare(`
        INSERT INTO mandi_prices (id, mandi_name, district, crop_type, min_price, max_price, modal_price, arrivals_quintals, price_date, source)
        VALUES (?,?,?,?,?,?,?,?,?,?)
      `).run(uuidv4(), mandi.name, mandi.district, 'groundnut',
        Math.round(groundnutModal * 0.96), Math.round(groundnutModal * 1.04), groundnutModal,
        Math.round(150 + Math.random() * 400), dateStr, 'mock');
    }
  }

  // Crop listings
  const grades = ['A', 'B', 'C', 'unknown'];
  const listingIds = [];
  for (const f of farmerIds) {
    // Cotton listing
    const l1 = uuidv4();
    const cottonQty = Math.round(20 + Math.random() * 80);
    const cottonGrade = grades[Math.floor(Math.random() * 3)];
    db.prepare(`
      INSERT INTO crop_listings (id, farmer_id, crop_type, quantity_quintals, asking_price_per_quintal, quality_grade, moisture_pct, village, taluka, district, harvest_date, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(l1, f.id, 'cotton', cottonQty, Math.round(6000 + Math.random() * 500),
      cottonGrade, 8 + Math.random() * 4, f.village, f.taluka, f.district,
      new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], 'available');
    listingIds.push({ id: l1, farmerId: f.id, cropType: 'cotton' });

    // Groundnut listing
    const l2 = uuidv4();
    const gnQty = Math.round(15 + Math.random() * 60);
    const gnGrade = grades[Math.floor(Math.random() * 3)];
    db.prepare(`
      INSERT INTO crop_listings (id, farmer_id, crop_type, quantity_quintals, asking_price_per_quintal, quality_grade, moisture_pct, village, taluka, district, harvest_date, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(l2, f.id, 'groundnut', gnQty, Math.round(5200 + Math.random() * 600),
      gnGrade, 7 + Math.random() * 3, f.village, f.taluka, f.district,
      new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], 'available');
    listingIds.push({ id: l2, farmerId: f.id, cropType: 'groundnut' });
  }

  // Buyer requirements
  const reqIds = [];
  for (const b of buyerIds) {
    const r1 = uuidv4();
    db.prepare(`
      INSERT INTO buyer_requirements (id, buyer_id, crop_type, quantity_quintals, max_price_per_quintal, min_quality, preferred_district, required_by, notes)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(r1, b.id, 'cotton', 200, 6500, 'A', 'Rajkot',
      new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      'Premium cotton for export. Need Grade A quality.');
    reqIds.push({ id: r1, buyerId: b.id });

    const r2 = uuidv4();
    db.prepare(`
      INSERT INTO buyer_requirements (id, buyer_id, crop_type, quantity_quintals, max_price_per_quintal, min_quality, preferred_district, required_by, notes)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(r2, b.id, 'groundnut', 100, 5800, 'B', 'Junagadh',
      new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      'For oil mill processing.');
    reqIds.push({ id: r2, buyerId: b.id });
  }

  // Sample offers and completed transactions
  for (let i = 0; i < 4; i++) {
    const listing = listingIds[i];
    const buyer = buyerIds[i % buyerIds.length];
    const offerId = uuidv4();
    const price = Math.round(5800 + Math.random() * 700);
    const qty = Math.round(20 + Math.random() * 30);
    db.prepare(`
      INSERT INTO offers (id, buyer_id, farmer_id, listing_id, offered_price_per_quintal, quantity_quintals, status, message)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(offerId, buyer.id, listing.farmerId, listing.id, price, qty,
      i < 2 ? 'accepted' : 'pending',
      'We are interested in purchasing your crop at the offered price.');

    if (i < 2) {
      const txId = uuidv4();
      const total = price * qty;
      db.prepare(`
        INSERT INTO transactions (id, offer_id, farmer_id, buyer_id, listing_id, crop_type, quantity_quintals, price_per_quintal, total_amount)
        VALUES (?,?,?,?,?,?,?,?,?)
      `).run(txId, offerId, listing.farmerId, buyer.id, listing.id, listing.cropType, qty, price, total);
      db.prepare("UPDATE crop_listings SET status='sold' WHERE id=?").run(listing.id);
    }
  }

  console.log('✅ Seed data created successfully!');
  console.log('\n📋 Demo Login Credentials (password: password123)');
  console.log('─────────────────────────────────────────────────');
  console.log('Admin:   phone: 9000000000');
  SAMPLE_FARMERS.forEach(f => console.log(`Farmer:  phone: ${f.phone}  name: ${f.name}`));
  SAMPLE_BUYERS.forEach(b => console.log(`Buyer:   phone: ${b.phone}  name: ${b.name}`));
}

seed().catch(console.error);
