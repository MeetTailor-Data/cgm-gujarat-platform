/**
 * Storage & Selling Advisor Agent
 * Recommends Sell Now / Store / Wait based on price forecasts and storage costs
 */
const { callGranite, MOCK_MODE } = require('./granite');
const { mandiPriceForecast } = require('./mandiForecasting');

// Storage cost constants (₹/quintal/week for Gujarat)
const STORAGE_COSTS = {
  cotton: { warehouse: 45, home: 15, insurance: 8 },
  groundnut: { warehouse: 55, home: 20, insurance: 10 },
};

async function storageSellingAdvisor({ cropType, district, quantity, currentPrice, storageType = 'warehouse' }) {
  const forecast = await mandiPriceForecast({ cropType, district });
  const storageCostPerQtlPerWeek = STORAGE_COSTS[cropType]?.[storageType] || 50;
  const totalStorageCostPerWeek = storageCostPerQtlPerWeek * quantity;

  // Calculate expected gain/loss for different holding periods
  const analysis = [1, 2, 3, 4].map(weeks => {
    const dayIndex = Math.min(weeks * 7 - 1, forecast.forecast.length - 1);
    const expectedPrice = forecast.forecast[dayIndex]?.predicted_price || currentPrice;
    const storageCost = storageCostPerQtlPerWeek * weeks * quantity;
    const priceChange = (expectedPrice - currentPrice) * quantity;
    const netGain = priceChange - storageCost;
    return { weeks, expected_price: expectedPrice, storage_cost: storageCost, price_change: priceChange, net_gain: netGain };
  });

  const sellNowValue = currentPrice * quantity;
  const bestOption = analysis.reduce((best, curr) => curr.net_gain > best.net_gain ? curr : best, { net_gain: -Infinity });

  let recommendation;
  if (bestOption.net_gain > 500) {
    recommendation = bestOption.weeks <= 1 ? 'STORE_SHORT' : 'WAIT';
  } else if (forecast.trend_direction === 'DOWN') {
    recommendation = 'SELL_NOW';
  } else {
    recommendation = 'STORE';
  }

  const mockAdvice = {
    SELL_NOW: `Price trend is declining. Sell your ${quantity} quintals of ${cropType} now at ₹${currentPrice}/qtl to maximize returns. Delaying could result in losses of ₹${Math.abs(analysis[1]?.net_gain || 0).toFixed(0)}.`,
    STORE: `Market is stable. Store your crop for 1–2 weeks. Storage cost is ₹${totalStorageCostPerWeek}/week. Monitor prices daily.`,
    WAIT: `Price trend is upward. Wait ${bestOption.weeks} weeks for potential gain of ₹${bestOption.net_gain.toFixed(0)}. Expected price: ₹${bestOption.expected_price}/qtl.`,
    STORE_SHORT: `Store for 1 week. Expected net gain: ₹${bestOption.net_gain.toFixed(0)} after storage costs of ₹${bestOption.storage_cost.toFixed(0)}.`,
  };

  if (MOCK_MODE) {
    return {
      crop: cropType,
      district,
      quantity,
      current_price: currentPrice,
      sell_now_value: sellNowValue,
      recommendation,
      recommendation_label: { SELL_NOW: 'Sell Now', STORE: 'Store', WAIT: 'Wait', STORE_SHORT: 'Store Short-term' }[recommendation],
      storage_analysis: analysis,
      ai_advice: mockAdvice[recommendation],
      best_holding_weeks: recommendation === 'SELL_NOW' ? 0 : bestOption.weeks,
      expected_best_price: bestOption.expected_price || currentPrice,
      storage_cost_per_week: totalStorageCostPerWeek,
      powered_by: 'IBM Granite (Mock Mode)',
      forecast_summary: forecast,
    };
  }

  const prompt = `You are an agricultural advisor for Gujarat farmers. Provide a storage/selling recommendation.

Crop: ${cropType} | District: ${district} | Quantity: ${quantity} quintals
Current mandi price: ₹${currentPrice}/quintal
Storage cost: ₹${storageCostPerQtlPerWeek}/qtl/week (${storageType})
Price trend: ${forecast.trend_direction} (${forecast.trend_pct}%/day)
7-day forecast: ${forecast.forecast.map(f => `Day ${f.day}: ₹${f.predicted_price}`).join(', ')}

Storage analysis:
${analysis.map(a => `Week ${a.weeks}: Expected ₹${a.expected_price}/qtl, Net gain: ₹${a.net_gain}`).join('\n')}

Give a clear recommendation: SELL_NOW, STORE (1-2 weeks), or WAIT (3-4 weeks). Include specific numbers. Be concise (3 sentences max).`;

  const { text } = await callGranite(prompt, 250);

  return {
    crop: cropType,
    district,
    quantity,
    current_price: currentPrice,
    sell_now_value: sellNowValue,
    recommendation,
    storage_analysis: analysis,
    ai_advice: text || mockAdvice[recommendation],
    powered_by: 'IBM Granite LLM',
    forecast_summary: forecast,
  };
}

module.exports = { storageSellingAdvisor };
