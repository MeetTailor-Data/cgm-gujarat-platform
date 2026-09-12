import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import { Filter, Send, X } from 'lucide-react';

const DISTRICTS = ['', 'Rajkot', 'Junagadh', 'Bhavnagar', 'Amreli', 'Jamnagar', 'Surendranagar', 'Morbi'];

const gradeBadge = {
  A: 'badge-grade-a', B: 'badge-grade-b', C: 'badge-grade-c',
  unknown: 'bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full inline-flex',
};

export default function BrowseListings() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ crop_type: '', district: '', min_quality: '', max_price: '' });
  const [offerModal, setOfferModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ offered_price_per_quintal: '', quantity_quintals: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState('');

  const fetchListings = () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    api.get(`/buyer/listings?${params}`).then(r => setListings(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, []);

  const sendOffer = async () => {
    if (!offerForm.offered_price_per_quintal || !offerForm.quantity_quintals) return;
    setSubmitting(true);
    try {
      await api.post('/buyer/offers', {
        listing_id: offerModal.id,
        offered_price_per_quintal: parseFloat(offerForm.offered_price_per_quintal),
        quantity_quintals: parseFloat(offerForm.quantity_quintals),
        message: offerForm.message,
      });
      setOfferSuccess(`Offer sent to ${offerModal.farmer_name}!`);
      setOfferModal(null);
      setOfferForm({ offered_price_per_quintal: '', quantity_quintals: '', message: '' });
      setTimeout(() => setOfferSuccess(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">{t('browseFarmers', lang)}</h1>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter Listings</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.crop_type} onChange={e => setFilters(f => ({ ...f, crop_type: e.target.value }))} className="input-field">
            <option value="">All Crops</option>
            <option value="cotton">{t('cotton', lang)}</option>
            <option value="groundnut">{t('groundnut', lang)}</option>
          </select>
          <select value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))} className="input-field">
            {DISTRICTS.map(d => <option key={d} value={d}>{d || 'All Districts'}</option>)}
          </select>
          <select value={filters.min_quality} onChange={e => setFilters(f => ({ ...f, min_quality: e.target.value }))} className="input-field">
            <option value="">Any Quality</option>
            <option value="A">Grade A+</option>
            <option value="B">Grade B+</option>
          </select>
          <input type="number" value={filters.max_price}
            onChange={e => setFilters(f => ({ ...f, max_price: e.target.value }))}
            className="input-field" placeholder="Max price/qtl" />
        </div>
        <button onClick={fetchListings} className="btn-primary mt-3 text-sm">Apply Filters</button>
      </div>

      {offerSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{offerSuccess}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔍</div>
          <div className="text-gray-500">No listings match your filters.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {listings.map(l => (
            <div key={l.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-semibold text-gray-900 capitalize">{t(l.crop_type, lang)}</span>
                  <span className="ml-2 text-gray-500 text-sm">{l.farmer_name}</span>
                </div>
                <span className={gradeBadge[l.quality_grade] || gradeBadge.unknown}>
                  {l.quality_grade === 'unknown' ? 'Ungraded' : `Grade ${l.quality_grade}`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                <span>📦 {l.quantity_quintals} quintals</span>
                <span>💰 ₹{l.asking_price_per_quintal?.toLocaleString('en-IN') || 'Negotiable'}/qtl</span>
                <span>💧 {l.moisture_pct?.toFixed(1) || '—'}% moisture</span>
                <span>📍 {[l.village, l.district].filter(Boolean).join(', ')}</span>
              </div>
              {l.image_path && (
                <img src={l.image_path} alt="Crop" className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <button
                onClick={() => {
                  setOfferModal(l);
                  setOfferForm({ offered_price_per_quintal: l.asking_price_per_quintal || '', quantity_quintals: l.quantity_quintals || '', message: '' });
                }}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                <Send className="w-4 h-4" /> {t('makeOffer', lang)}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Send Offer to {offerModal.farmer_name}</h3>
              <button onClick={() => setOfferModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {offerModal.crop_type} · {offerModal.quantity_quintals} qtl available · Asking ₹{offerModal.asking_price_per_quintal}/qtl
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Offer Price (₹/qtl) *</label>
                <input type="number" min="1" value={offerForm.offered_price_per_quintal}
                  onChange={e => setOfferForm(f => ({ ...f, offered_price_per_quintal: e.target.value }))}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (qtl) *</label>
                <input type="number" min="1" max={offerModal.quantity_quintals} value={offerForm.quantity_quintals}
                  onChange={e => setOfferForm(f => ({ ...f, quantity_quintals: e.target.value }))}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message to Farmer</label>
                <textarea value={offerForm.message} onChange={e => setOfferForm(f => ({ ...f, message: e.target.value }))}
                  className="input-field" rows={2} placeholder="Introduce yourself or add terms..." />
              </div>
              {offerForm.offered_price_per_quintal && offerForm.quantity_quintals && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  Total offer: <strong>₹{(offerForm.offered_price_per_quintal * offerForm.quantity_quintals).toLocaleString('en-IN')}</strong>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={sendOffer} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Sending...' : 'Send Offer'}
                </button>
                <button onClick={() => setOfferModal(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
