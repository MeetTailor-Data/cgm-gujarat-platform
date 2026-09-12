import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import { Package, Brain, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const DISTRICTS = ['Rajkot', 'Junagadh', 'Bhavnagar', 'Amreli', 'Jamnagar', 'Surendranagar', 'Morbi'];

const recStyle = {
  SELL_NOW: { bg: 'bg-red-50 border-red-400', title: '🔴 Sell Now!', desc: 'Prices are falling. Sell immediately.' },
  STORE: { bg: 'bg-yellow-50 border-yellow-400', title: '🟡 Store', desc: 'Hold your crop for 1–2 weeks.' },
  WAIT: { bg: 'bg-green-50 border-green-400', title: '🟢 Wait', desc: 'Prices are rising. Wait for better returns.' },
  STORE_SHORT: { bg: 'bg-blue-50 border-blue-400', title: '🔵 Store Short-term', desc: 'Store for 1 week for better returns.' },
};

export default function StorageAdvice() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [form, setForm] = useState({
    crop_type: 'cotton', district: 'Rajkot',
    quantity: '', current_price: '', storage_type: 'warehouse',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await api.post('/ai/storage-advice', {
        crop_type: form.crop_type, district: form.district,
        quantity: parseFloat(form.quantity), current_price: parseFloat(form.current_price),
        storage_type: form.storage_type,
      });
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get advice');
    } finally {
      setLoading(false);
    }
  };

  const rec = result ? recStyle[result.recommendation] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-green-600" />
        <h1 className="text-xl font-bold text-gray-900">{t('storageAdvice', lang)}</h1>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">IBM Granite AI</span>
      </div>

      <div className="card space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('cropType', lang)}</label>
              <select value={form.crop_type} onChange={e => setForm(f => ({ ...f, crop_type: e.target.value }))} className="input-field">
                <option value="cotton">{t('cotton', lang)}</option>
                <option value="groundnut">{t('groundnut', lang)}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('district', lang)}</label>
              <select value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="input-field">
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('quantity', lang)} *</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="input-field" placeholder="e.g. 50" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Price (₹/qtl) *</label>
              <input type="number" min="1" value={form.current_price} onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))}
                className="input-field" placeholder="e.g. 6200" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Type</label>
            <select value={form.storage_type} onChange={e => setForm(f => ({ ...f, storage_type: e.target.value }))} className="input-field">
              <option value="warehouse">Warehouse (APMC/Cold storage)</option>
              <option value="home">Home Storage</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <Brain className="w-4 h-4" />
            {loading ? 'Calculating best strategy...' : (lang === 'gu' ? 'AI સ્ટોરેજ સલાહ મેળવો' : 'Get AI Storage & Selling Advice')}
          </button>
        </form>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {result && rec && (
        <div className="space-y-4">
          {/* Recommendation */}
          <div className={`border-2 rounded-xl p-5 ${rec.bg}`}>
            <div className="text-xl font-bold text-gray-900 mb-1">{rec.title}</div>
            <div className="text-gray-700 text-sm mb-3">{result.ai_advice}</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><div className="text-gray-500 text-xs">Sell Now Value</div>
                <div className="font-bold text-lg">₹{result.sell_now_value?.toLocaleString('en-IN')}</div></div>
              <div><div className="text-gray-500 text-xs">Best Strategy</div>
                <div className="font-bold text-lg">{result.recommendation.replace('_', ' ')}</div></div>
              <div><div className="text-gray-500 text-xs">Storage/week</div>
                <div className="font-bold text-lg">₹{result.storage_cost_per_week}</div></div>
            </div>
          </div>

          {/* Net gain chart */}
          {result.storage_analysis?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Net Gain by Holding Period</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={result.storage_analysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="weeks" tickFormatter={v => `Week ${v}`} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => [`₹${Math.round(val)}`, 'Net Gain']} />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
                  <Bar dataKey="net_gain" fill="#22c55e" name="Net Gain"
                    label={{ position: 'top', fontSize: 10, formatter: v => `₹${Math.round(v)}` }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="text-xs text-gray-400 text-right">{result.powered_by}</div>
        </div>
      )}
    </div>
  );
}
