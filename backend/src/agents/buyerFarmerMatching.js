/**
 * Buyer-Farmer Matching Agent
 * Matches buyers to farmers using crop, quantity, location, quality and price criteria
 */
const { callGranite, MOCK_MODE } = require('./granite');
const { getDB } = require('../db/database');

function scoreMatch(listing, requirement) {
  let score = 0;
  const reasons = [];

  // Crop match (mandatory)
  if (listing.crop_type !== requirement.crop_type) return null;

  // Quality check
  const gradeOrder = { A: 3, B: 2, C: 1, unknown: 0 };
  const listingGrade = gradeOrder[listing.quality_grade] ?? 0;
  const reqGrade = gradeOrder[requirement.min_quality] ?? 0;
  if (listingGrade >= reqGrade) {
    score += 30 + (listingGrade - reqGrade) * 5;
    reasons.push(`Quality ${listing.quality_grade} meets requirement`);
  } else {
    score -= 20;
    reasons.push(`Quality below requirement`);
  }

  // Quantity compatibility
  if (listing.quantity_quintals >= requirement.quantity_quintals) {
    score += 25;
    reasons.push('Quantity sufficient');
  } else if (listing.quantity_quintals >= requirement.quantity_quintals * 0.7) {
    score += 10;
    reasons.push('Partial quantity available');
  }

  // Price match
  if (requirement.max_price_per_quintal && listing.asking_price_per_quintal) {
    if (listing.asking_price_per_quintal <= requirement.max_price_per_quintal) {
      score += 25;
      reasons.push('Price within budget');
    } else {
      const overpct = ((listing.asking_price_per_quintal - requirement.max_price_per_quintal) / requirement.max_price_per_quintal) * 100;
      score -= Math.min(20, overpct);
      reasons.push(`Price ${overpct.toFixed(0)}% above budget`);
    }
  } else {
    score += 10; // No price constraint
  }

  // Location proximity
  if (requirement.preferred_district && listing.district === requirement.preferred_district) {
    score += 15;
    reasons.push('Same district');
  } else if (requirement.preferred_district) {
    score += 5;
    reasons.push('Different district');
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

async function matchBuyerFarmer({ requirementId, buyerId }) {
  const db = getDB();

  const requirement = db.prepare('SELECT * FROM buyer_requirements WHERE id = ? AND buyer_id = ?').get(requirementId, buyerId);
  if (!requirement) return { error: 'Requirement not found' };

  const listings = db.prepare(`
    SELECT cl.*, u.name as farmer_name, fp.village, fp.taluka, fp.district
    FROM crop_listings cl
    JOIN users u ON cl.farmer_id = u.id
    LEFT JOIN farmer_profiles fp ON fp.user_id = cl.farmer_id
    WHERE cl.crop_type = ? AND cl.status = 'available'
    ORDER BY cl.created_at DESC
  `).all(requirement.crop_type);

  const scored = listings
    .map(listing => {
      const match = scoreMatch(listing, requirement);
      if (!match) return null;
      return { listing, ...match };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (MOCK_MODE || scored.length === 0) {
    return {
      requirement,
      matches: scored,
      total_found: scored.length,
      ai_summary: scored.length === 0
        ? `No matching ${requirement.crop_type} listings found in Gujarat at this time. Consider broadening your quality or location criteria.`
        : `Found ${scored.length} matching farmer${scored.length > 1 ? 's' : ''} for your ${requirement.crop_type} requirement. Top match has ${scored[0]?.listing.quality_grade} grade quality at ₹${scored[0]?.listing.asking_price_per_quintal}/qtl from ${scored[0]?.listing.district || 'Gujarat'}.`,
      powered_by: 'IBM Granite (Mock Mode)',
    };
  }

  const topMatches = scored.slice(0, 3).map(m =>
    `Farmer: ${m.listing.farmer_name}, Grade: ${m.listing.quality_grade}, Qty: ${m.listing.quantity_quintals} qtl, Price: ₹${m.listing.asking_price_per_quintal}/qtl, Location: ${m.listing.district}, Score: ${m.score}%`
  ).join('\n');

  const prompt = `You are an agricultural commodity trading assistant for Gujarat.

Buyer requirement: ${requirement.crop_type}, ${requirement.quantity_quintals} quintals, max price ₹${requirement.max_price_per_quintal}/qtl, min quality: ${requirement.min_quality}

Top matching farmers:
${topMatches}

Provide a 2-sentence summary recommendation to the buyer about which farmers are the best match and why.`;

  const { text } = await callGranite(prompt, 200);

  return {
    requirement,
    matches: scored,
    total_found: scored.length,
    ai_summary: text || `Found ${scored.length} matching farmers for your requirement.`,
    powered_by: 'IBM Granite LLM',
  };
}

module.exports = { matchBuyerFarmer };
