/**
 * Income Dashboard Agent
 * Calculates expected income and market insights for farmers
 */
const { callGranite, MOCK_MODE } = require('./granite');
const { getDB } = require('../db/database');

async function incomeDashboardAgent({ farmerId }) {
  const db = getDB();

  // Fetch farmer's listings and transactions
  const listings = db.prepare(`
    SELECT * FROM crop_listings WHERE farmer_id = ? ORDER BY created_at DESC
  `).all(farmerId);

  const transactions = db.prepare(`
    SELECT t.*, u.name as buyer_name FROM transactions t
    JOIN users u ON t.buyer_id = u.id
    WHERE t.farmer_id = ? ORDER BY t.completed_at DESC
  `).all(farmerId);

  const pendingOffers = db.prepare(`
    SELECT o.*, u.name as buyer_name, cl.crop_type FROM offers o
    JOIN users u ON o.buyer_id = u.id
    JOIN crop_listings cl ON o.listing_id = cl.id
    WHERE o.farmer_id = ? AND o.status = 'pending'
  `).all(farmerId);

  // Income calculations
  const totalEarned = transactions.reduce((sum, t) => sum + t.total_amount, 0);
  const thisMonthStart = new Date(); thisMonthStart.setDate(1); thisMonthStart.setHours(0, 0, 0, 0);
  const monthlyEarned = transactions
    .filter(t => new Date(t.completed_at) >= thisMonthStart)
    .reduce((sum, t) => sum + t.total_amount, 0);

  const activeCotton = listings.filter(l => l.crop_type === 'cotton' && l.status === 'available');
  const activeGroundnut = listings.filter(l => l.crop_type === 'groundnut' && l.status === 'available');
  const totalPendingQty = listings.filter(l => l.status === 'available').reduce((s, l) => s + l.quantity_quintals, 0);

  // Fetch latest mandi prices
  const cottonPrice = db.prepare(`
    SELECT modal_price FROM mandi_prices WHERE crop_type='cotton' ORDER BY price_date DESC LIMIT 1
  `).get()?.modal_price || 6200;
  const groundnutPrice = db.prepare(`
    SELECT modal_price FROM mandi_prices WHERE crop_type='groundnut' ORDER BY price_date DESC LIMIT 1
  `).get()?.modal_price || 5500;

  const estimatedCottonValue = activeCotton.reduce((s, l) => s + l.quantity_quintals * (l.asking_price_per_quintal || cottonPrice), 0);
  const estimatedGroundnutValue = activeGroundnut.reduce((s, l) => s + l.quantity_quintals * (l.asking_price_per_quintal || groundnutPrice), 0);

  const cropBreakdown = {};
  transactions.forEach(t => {
    cropBreakdown[t.crop_type] = (cropBreakdown[t.crop_type] || 0) + t.total_amount;
  });

  const dashboard = {
    farmer_id: farmerId,
    summary: {
      total_earned: totalEarned,
      monthly_earned: monthlyEarned,
      total_transactions: transactions.length,
      pending_offers: pendingOffers.length,
      active_listings: listings.filter(l => l.status === 'available').length,
      total_pending_qty: totalPendingQty,
    },
    estimated_inventory_value: {
      cotton: estimatedCottonValue,
      groundnut: estimatedGroundnutValue,
      total: estimatedCottonValue + estimatedGroundnutValue,
    },
    crop_breakdown: cropBreakdown,
    market_prices: { cotton: cottonPrice, groundnut: groundnutPrice },
    recent_transactions: transactions.slice(0, 5),
    pending_offers: pendingOffers,
    listings_summary: {
      cotton: activeCotton.length,
      groundnut: activeGroundnut.length,
    },
  };

  if (MOCK_MODE) {
    dashboard.ai_insights = [
      totalEarned === 0
        ? '🌱 No transactions yet. Add your crop listings to start receiving offers from buyers.'
        : `💰 You have earned ₹${totalEarned.toLocaleString('en-IN')} so far this season.`,
      pendingOffers.length > 0
        ? `📬 You have ${pendingOffers.length} pending offer${pendingOffers.length > 1 ? 's' : ''} from buyers. Review and accept to complete sales.`
        : '📭 No pending offers. Your listings are visible to buyers.',
      totalPendingQty > 0
        ? `📦 You have ${totalPendingQty} quintals of unsold crop worth approximately ₹${(estimatedCottonValue + estimatedGroundnutValue).toLocaleString('en-IN')}.`
        : '✅ All listed crops have been sold or reserved.',
    ];
    dashboard.powered_by = 'IBM Granite (Mock Mode)';
    return dashboard;
  }

  const prompt = `Agricultural income analysis for Gujarat farmer:
Total earned: ₹${totalEarned}, Monthly: ₹${monthlyEarned}, Pending offers: ${pendingOffers.length}
Unsold inventory: Cotton ${activeCotton.length} listings (${activeCotton.reduce((s, l) => s + l.quantity_quintals, 0)} qtl), Groundnut ${activeGroundnut.length} listings (${activeGroundnut.reduce((s, l) => s + l.quantity_quintals, 0)} qtl)
Current mandi: Cotton ₹${cottonPrice}/qtl, Groundnut ₹${groundnutPrice}/qtl

Provide 3 actionable insights for this farmer to maximize income. Be specific with numbers. Keep each insight under 2 sentences.
Format as JSON array: ["insight1", "insight2", "insight3"]`;

  const { text } = await callGranite(prompt, 300);
  try {
    dashboard.ai_insights = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]');
  } catch {
    dashboard.ai_insights = [];
  }
  dashboard.powered_by = 'IBM Granite LLM';

  return dashboard;
}

module.exports = { incomeDashboardAgent };
