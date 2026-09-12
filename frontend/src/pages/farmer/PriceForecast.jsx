import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

const DISTRICTS = ['Rajkot', 'Junagadh', 'Bhavnagar', 'Amreli', 'Jamnagar', 'Surendranagar', 'Morbi'];

const recColors = {
  SELL_NOW: { bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Sell Now' },
  STORE: { bg: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-100 text-yellow-800', icon: Minus, label: 'Store' },
  WAIT: { bg: 'bg-green-50 border-green-300', badge: 'bg-green-100 text-green-800', icon: TrendingUp, label: 'Wait' },
};

export default function PriceForecast() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [form, setForm] = useState({ crop_type: 'cotton', district: 'Rajkot' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleForecast = async () => {
    setError(''); setLoading(true);
    try {
      const r = await api.post('/ai/forecast', form);
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Forecast failed');
    } finally {
      setLoading(false);
    }
  };

  const rec = result ? recColors[result.recommendation] : null;
  const RecIcon = rec?.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">{t('priceForecast', lang)}</h1>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          {t('aiPowered', lang)}
        </span>
      </div>

      {/* Input card */}
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cropType', lang)}</label>
            <select value={form.crop_type}
              onChange={e => setForm(f => ({ ...f, crop_type: e.target.value }))}
              className="input-field">
              <option value="cotton">{t('cotton', lang)}</option>
              <option value="groundnut">{t('groundnut', lang)}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('district', lang)}</label>
            <select value={form.district}
              onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
              className="input-field">
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleForecast} disabled={loading} className="btn-primary w-full">
          {loading ? '🔮 Analyzing market data...' : (lang === 'gu' ? 'ભાવ અનુમાન મેળવો' : 'Get AI Price Forecast')}
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {result && (
        <div className="space-y-4">
          {/* Recommendation Banner */}
          {rec && (
            <div className={`border-2 rounded-xl p-5 ${rec.bg}`}>
              <div className="flex items-center gap-3">
                <RecIcon className="w-7 h-7" />
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    Recommendation: <span className={`px-3 py-1 rounded-full text-sm font-bold ${rec.badge}`}>{rec.label}</span>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">{result.ai_explanation}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <span>Current: <strong>₹{result.current_price}/qtl</strong></span>
                <span>Trend: <strong>{result.trend_direction} ({result.trend_pct}%/day)</strong></span>
                <span>Confidence: <strong>{result.confidence}%</strong></span>
              </div>
            </div>
          )}

          {/* Forecast Chart */}
          {result.forecast?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">7-Day Price Forecast (₹/Quintal)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip formatter={(val) => [`₹${val}`, 'Predicted Price']} />
                  <Area type="monotone" dataKey="predicted_price"
                    stroke={form.crop_type === 'cotton' ? '#1565c0' : '#f57f17'}
                    fill={form.crop_type === 'cotton' ? '#e3f2fd' : '#fff8e1'}
                    strokeWidth={2} name="Price" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Forecast Table */}
          <div className="card overflow-x-auto">
            <h3 className="font-semibold text-gray-800 mb-3">Daily Forecast Breakdown</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2">Day</th>
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Predicted Price</th>
                  <th className="text-right py-2">Change</th>
                </tr>
              </thead>
              <tbody>
                {result.forecast.map((f, i) => {
                  const change = f.predicted_price - result.current_price;
                  return (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2">Day {f.day}</td>
                      <td className="py-2 text-gray-500">{f.date}</td>
                      <td className="py-2 text-right font-semibold">₹{f.predicted_price}</td>
                      <td className={`py-2 text-right text-xs font-medium ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {change > 0 ? '+' : ''}{change} ({((change / result.current_price) * 100).toFixed(1)}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-gray-400 text-right">{result.powered_by} · {result.generated_at}</div>
        </div>
      )}
    </div>
  );
}
