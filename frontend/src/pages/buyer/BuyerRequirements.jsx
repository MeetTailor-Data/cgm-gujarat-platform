import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import { Plus, Trash2 } from 'lucide-react';

const DISTRICTS = ['', 'Rajkot', 'Junagadh', 'Bhavnagar', 'Amreli', 'Jamnagar', 'Surendranagar', 'Morbi'];

export default function BuyerRequirements() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [reqs, setReqs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    crop_type: 'cotton', quantity_quintals: '', max_price_per_quintal: '',
    min_quality: 'B', preferred_district: '', required_by: '', notes: '',
  });

  const fetchReqs = () => {
    setLoading(true);
    api.get('/buyer/requirements').then(r => setReqs(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchReqs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/buyer/requirements', form);
      setShowForm(false);
      setForm({ crop_type: 'cotton', quantity_quintals: '', max_price_per_quintal: '', min_quality: 'B', preferred_district: '', required_by: '', notes: '' });
      fetchReqs();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('requirements', lang)}</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> {t('addRequirement', lang)}
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800">New Requirement</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('cropType', lang)} *</label>
                <select value={form.crop_type} onChange={e => setForm(f => ({ ...f, crop_type: e.target.value }))} className="input-field">
                  <option value="cotton">{t('cotton', lang)}</option>
                  <option value="groundnut">{t('groundnut', lang)}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Quality</label>
                <select value={form.min_quality} onChange={e => setForm(f => ({ ...f, min_quality: e.target.value }))} className="input-field">
                  <option value="A">Grade A (Premium only)</option>
                  <option value="B">Grade B+ (Standard+)</option>
                  <option value="C">Grade C+ (Any)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('quantity', lang)} *</label>
                <input type="number" min="1" value={form.quantity_quintals}
                  onChange={e => setForm(f => ({ ...f, quantity_quintals: e.target.value }))}
                  className="input-field" placeholder="e.g. 200" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹/qtl)</label>
                <input type="number" min="0" value={form.max_price_per_quintal}
                  onChange={e => setForm(f => ({ ...f, max_price_per_quintal: e.target.value }))}
                  className="input-field" placeholder="e.g. 6500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred District</label>
                <select value={form.preferred_district} onChange={e => setForm(f => ({ ...f, preferred_district: e.target.value }))} className="input-field">
                  {DISTRICTS.map(d => <option key={d} value={d}>{d || 'Any District'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required By</label>
                <input type="date" value={form.required_by}
                  onChange={e => setForm(f => ({ ...f, required_by: e.target.value }))}
                  className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="input-field" rows={2} placeholder="Additional requirements..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Saving...' : 'Add Requirement'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : reqs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📋</div>
          <div className="text-gray-500 mb-3">No requirements added yet.</div>
          <button onClick={() => setShowForm(true)} className="btn-primary">Add First Requirement</button>
        </div>
      ) : (
        <div className="space-y-3">
          {reqs.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 capitalize">{r.crop_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.status}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Min Grade {r.min_quality}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <span>📦 {r.quantity_quintals} qtl needed</span>
                    <span>💰 Max ₹{r.max_price_per_quintal || 'Any'}/qtl</span>
                    <span>📍 {r.preferred_district || 'Any district'}</span>
                    <span>📅 By {r.required_by || 'Open-ended'}</span>
                  </div>
                  {r.notes && <div className="text-sm text-gray-500 mt-1 italic">"{r.notes}"</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
