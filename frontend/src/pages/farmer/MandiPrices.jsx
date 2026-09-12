import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DISTRICTS = ['All Gujarat', 'Rajkot', 'Junagadh', 'Bhavnagar', 'Amreli', 'Jamnagar', 'Surendranagar'];

export default function MandiPrices() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [prices, setPrices] = useState([]);
  const [summary, setSummary] = useState([]);
  const [district, setDistrict] = useState('All Gujarat');
  const [cropType, setCropType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams({ days: 30 });
    if (cropType) params.set('crop_type', cropType);
    if (district !== 'All Gujarat') params.set('district', district);

    Promise.all([
      api.get(`/mandi/prices?${params}`),
      api.get('/mandi/summary'),
    ]).then(([p, s]) => {
      setPrices(p.data);
      setSummary(s.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [district, cropType]);

  // Prepare chart data — aggregate by date
  const chartData = React.useMemo(() => {
    const byDate = {};
    prices.forEach(p => {
      if (!byDate[p.price_date]) byDate[p.price_date] = { date: p.price_date };
      const key = `${p.crop_type}_${p.mandi_name}`.slice(0, 20);
      if (!byDate[p.price_date][p.crop_type]) byDate[p.price_date][p.crop_type] = 0;
      byDate[p.price_date][p.crop_type] = Math.max(byDate[p.price_date][p.crop_type], p.modal_price);
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [prices]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('mandiPrices', lang)}</h1>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-1 text-sm">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        {summary.map(s => (
          <div key={s.crop_type} className={`card border-l-4 ${s.crop_type === 'cotton' ? 'border-blue-500' : 'border-yellow-500'}`}>
            <div className="font-semibold text-gray-800 capitalize mb-2">{t(s.crop_type, lang)}</div>
            <div className="text-3xl font-bold text-gray-900">₹{s.avg_price?.toLocaleString('en-IN')}</div>
            <div className="text-xs text-gray-500 mt-1">7-day avg · Min ₹{s.min_price} · Max ₹{s.max_price}</div>
            <div className="text-xs text-gray-400">Last updated: {s.latest_date}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={district} onChange={e => setDistrict(e.target.value)} className="input-field max-w-xs">
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={cropType} onChange={e => setCropType(e.target.value)} className="input-field max-w-xs">
          <option value="">All Crops</option>
          <option value="cotton">{t('cotton', lang)}</option>
          <option value="groundnut">{t('groundnut', lang)}</option>
        </select>
      </div>

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">30-Day Price Trend (₹/Quintal)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => `₹${val}`} />
              <Legend />
              {(!cropType || cropType === 'cotton') && (
                <Line type="monotone" dataKey="cotton" stroke="#1565c0" strokeWidth={2} dot={false} name="Cotton" />
              )}
              {(!cropType || cropType === 'groundnut') && (
                <Line type="monotone" dataKey="groundnut" stroke="#f57f17" strokeWidth={2} dot={false} name="Groundnut" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <h3 className="font-semibold text-gray-800 mb-3">Latest Mandi Prices</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 font-semibold text-gray-600">Mandi</th>
                <th className="text-left py-2 font-semibold text-gray-600">District</th>
                <th className="text-left py-2 font-semibold text-gray-600">Crop</th>
                <th className="text-right py-2 font-semibold text-gray-600">Min</th>
                <th className="text-right py-2 font-semibold text-gray-600">Modal</th>
                <th className="text-right py-2 font-semibold text-gray-600">Max</th>
                <th className="text-right py-2 font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {prices.slice(0, 30).map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2">{p.mandi_name}</td>
                  <td className="py-2 text-gray-500">{p.district}</td>
                  <td className="py-2">
                    <span className={`capitalize text-xs font-medium px-2 py-0.5 rounded-full ${p.crop_type === 'cotton' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {t(p.crop_type, lang)}
                    </span>
                  </td>
                  <td className="text-right py-2">₹{p.min_price}</td>
                  <td className="text-right py-2 font-semibold">₹{p.modal_price}</td>
                  <td className="text-right py-2">₹{p.max_price}</td>
                  <td className="text-right py-2 text-gray-400 text-xs">{p.price_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
