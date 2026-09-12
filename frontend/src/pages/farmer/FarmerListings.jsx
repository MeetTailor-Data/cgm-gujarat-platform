import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';

const statusBadge = {
  available: 'bg-green-100 text-green-800',
  sold: 'bg-gray-100 text-gray-600',
  reserved: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-700',
};

const gradeBadge = { A: 'badge-grade-a', B: 'badge-grade-b', C: 'badge-grade-c', unknown: 'bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full inline-flex' };

export default function FarmerListings() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = () => {
    setLoading(true);
    api.get('/farmer/listings')
      .then(r => setListings(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/farmer/listings/${id}`, { status });
    fetchListings();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('myListings', lang)}</h1>
        <div className="flex gap-2">
          <button onClick={fetchListings} className="btn-secondary flex items-center gap-1 text-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link to="/farmer/add-crop" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            {t('addCrop', lang)}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🌾</div>
          <div className="text-gray-500 mb-4">No crop listings yet</div>
          <Link to="/farmer/add-crop" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Your First Crop
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(l => (
            <div key={l.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-gray-900 capitalize">
                      {t(l.crop_type, lang)}
                    </span>
                    <span className={gradeBadge[l.quality_grade] || gradeBadge.unknown}>
                      {l.quality_grade === 'unknown' ? 'Ungraded' : `Grade ${l.quality_grade}`}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[l.status] || 'bg-gray-100 text-gray-600'}`}>
                      {t(l.status, lang)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <span>📦 {l.quantity_quintals} qtl</span>
                    <span>💰 ₹{l.asking_price_per_quintal?.toLocaleString('en-IN') || '—'}/qtl</span>
                    <span>💧 {l.moisture_pct?.toFixed(1) || '—'}% moisture</span>
                    <span>📍 {[l.village, l.district].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Added: {new Date(l.created_at).toLocaleDateString('en-IN')}
                    {l.harvest_date && ` · Harvested: ${l.harvest_date}`}
                  </div>
                </div>
                {l.status === 'available' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateStatus(l.id, 'sold')}
                      className="text-xs btn-success">
                      Mark Sold
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
