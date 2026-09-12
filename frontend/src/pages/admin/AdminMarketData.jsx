import React, { useEffect, useState } from 'react';
import api from '../../hooks/useApi';
import { RefreshCw, Plus } from 'lucide-react';

export default function AdminMarketData() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    mandi_name: '', district: 'Rajkot', crop_type: 'cotton',
    min_price: '', max_price: '', modal_price: '', arrivals_quintals: '',
    price_date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchListings = () => {
    setLoading(true);
    api.get('/admin/listings').then(r => setListings(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, []);

  const handleAddMandi = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/mandi', form);
      setSuccess('Mandi price added!');
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const DISTRICTS = ['Rajkot', 'Junagadh', 'Bhavnagar', 'Amreli', 'Jamnagar', 'Surendranagar', 'Morbi'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Market Data Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" /> Add Mandi Price
          </button>
          <button onClick={fetchListings} className="btn-secondary flex items-center gap-1 text-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      {showForm && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800">Add Mandi Price Record</h3>
          <form onSubmit={handleAddMandi} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mandi Name *</label>
                <input value={form.mandi_name} onChange={e => setForm(f => ({ ...f, mandi_name: e.target.value }))}
                  className="input-field" placeholder="e.g. Rajkot APMC" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="input-field">
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
                <select value={form.crop_type} onChange={e => setForm(f => ({ ...f, crop_type: e.target.value }))} className="input-field">
                  <option value="cotton">Cotton</option>
                  <option value="groundnut">Groundnut</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modal Price (₹) *</label>
                <input type="number" value={form.modal_price} onChange={e => setForm(f => ({ ...f, modal_price: e.target.value }))}
                  className="input-field" placeholder="6200" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₹)</label>
                <input type="number" value={form.min_price} onChange={e => setForm(f => ({ ...f, min_price: e.target.value }))}
                  className="input-field" placeholder="6000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹)</label>
                <input type="number" value={form.max_price} onChange={e => setForm(f => ({ ...f, max_price: e.target.value }))}
                  className="input-field" placeholder="6400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={form.price_date} onChange={e => setForm(f => ({ ...f, price_date: e.target.value }))}
                  className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arrivals (qtl)</label>
                <input type="number" value={form.arrivals_quintals} onChange={e => setForm(f => ({ ...f, arrivals_quintals: e.target.value }))}
                  className="input-field" placeholder="500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Saving...' : 'Add Mandi Price'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Listings table */}
      <div className="card overflow-x-auto">
        <h3 className="font-semibold text-gray-800 mb-3">All Crop Listings ({listings.length})</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2">Farmer</th>
                <th className="text-left py-2">Crop</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-left py-2">Grade</th>
                <th className="text-left py-2">District</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {listings.slice(0, 50).map(l => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 font-medium">{l.farmer_name}</td>
                  <td className="py-2 capitalize">{l.crop_type}</td>
                  <td className="py-2 text-right">{l.quantity_quintals}</td>
                  <td className="py-2 text-right">₹{l.asking_price_per_quintal || '—'}</td>
                  <td className="py-2">{l.quality_grade}</td>
                  <td className="py-2 text-gray-500">{l.district}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
