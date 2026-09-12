/**
 * Mandi Price Forecasting Agent
 * Analyzes historical mandi prices and predicts 7-day trend using IBM Granite
 */
const { callGranite, MOCK_MODE } = require('./granite');
const { getDB } = require('../db/database');

// Statistical helpers
function average(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function linearTrend(prices) {
  const n = prices.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = average(prices);
  let num = 0, den = 0;
  prices.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  return den ? num / den : 0;
}

function getHistoricalPrices(cropType, district, days = 30) {
  const db = getDB();
  const rows = db.prepare(`
    SELECT modal_price, price_date FROM mandi_prices
    WHERE crop_type = ? AND (district = ? OR ? IS NULL)
    ORDER BY price_date DESC LIMIT ?
  `).all(cropType, district, district, days);
  return rows.reverse();
}

function buildMockForecast(cropType, district, historical) {
  const prices = historical.map(r => r.modal_price);
  const latest = prices[prices.length - 1] || (cropType === 'cotton' ? 6200 : 5400);
  const trend = linearTrend(prices);
  const trendPct = (trend / latest) * 100;

  const forecast = [];
  for (let i = 1; i <= 7; i++) {
    const noise = (Math.random() - 0.5) * 60;
    forecast.push({
      day: i,
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      predicted_price: Math.round(latest + trend * i + noise),
    });
  }

  let recommendation;
  if (trendPct > 1.5) recommendation = 'WAIT';
  else if (trendPct < -1.5) recommendation = 'SELL_NOW';
  else recommendation = 'STORE';

  const confidence = Math.min(95, 60 + prices.length * 0.5);

  return {
    crop: cropType,
    district,
    current_price: latest,
    trend_direction: trendPct > 0 ? 'UP' : trendPct < 0 ? 'DOWN' : 'STABLE',
    trend_pct: trendPct.toFixed(2),
    forecast,
    recommendation,
    confidence: confidence.toFixed(0),
    ai_explanation: `Based on ${prices.length} days of historical data for ${cropType} in ${district || 'Gujarat'}, the modal price is ₹${latest}/qtl. The trend is ${trendPct > 0 ? 'upward' : 'downward'} at ${Math.abs(trendPct).toFixed(1)}%/day. Recommendation: ${recommendation === 'WAIT' ? 'Wait for prices to rise further' : recommendation === 'SELL_NOW' ? 'Sell now before prices fall' : 'Store for 1–2 weeks and monitor'}.`,
    powered_by: 'IBM Granite (Mock Mode)',
    generated_at: new Date().toISOString(),
  };
}

async function mandiPriceForecast({ cropType, district }) {
  const historical = getHistoricalPrices(cropType, district, 30);
  const prices = historical.map(r => r.modal_price);

  if (MOCK_MODE || prices.length === 0) {
    return buildMockForecast(cropType, district, historical);
  }

  const prompt = `You are an agricultural market analyst for Gujarat, India. Analyze the following mandi price data and provide a 7-day price forecast.

Crop: ${cropType}
District: ${district || 'Gujarat'}
Historical modal prices (last ${prices.length} days): ${prices.join(', ')} (₹/quintal)
Current price: ₹${prices[prices.length - 1]}/quintal

Provide:
1. 7-day price forecast (day, predicted price in ₹/quintal)
2. Trend direction: UP/DOWN/STABLE
3. Recommendation: SELL_NOW / STORE / WAIT
4. Brief explanation (2-3 sentences) in simple English

Respond in JSON format:
{
  "trend_direction": "UP|DOWN|STABLE",
  "trend_pct": <number>,
  "forecast": [{"day": 1, "date": "YYYY-MM-DD", "predicted_price": <number>}, ...],
  "recommendation": "SELL_NOW|STORE|WAIT",
  "confidence": <0-100>,
  "ai_explanation": "<explanation>"
}`;

  const { text, latencyMs } = await callGranite(prompt, 600);

  try {
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
    return {
      crop: cropType,
      district,
      current_price: prices[prices.length - 1],
      ...json,
      powered_by: 'IBM Granite LLM',
      generated_at: new Date().toISOString(),
    };
  } catch {
    return buildMockForecast(cropType, district, historical);
  }
}

module.exports = { mandiPriceForecast };
