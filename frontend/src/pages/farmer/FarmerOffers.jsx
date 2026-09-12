import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function FarmerOffers() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  const fetchOffers = () => {
    setLoading(true);
    api.get('/farmer/offers').then(r => setOffers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOffers(); }, []);

  const respond = async (id, action) => {
    setResponding(id);
    try {
      await api.post(`/farmer/offers/${id}/respond`, { action });
      fetchOffers();
    } finally {
      setResponding(null);
    }
  };

  const statusBadge = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">{t('myOffers', lang)}</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading offers...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📭</div>
          <div className="text-gray-500">No offers received yet.</div>
          <div className="text-sm text-gray-400 mt-1">Add crop listings to start receiving buyer offers.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(o => (
            <div key={o.id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-gray-900">{o.buyer_name}</span>
                    {o.company_name && <span className="text-sm text-gray-500">({o.company_name})</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {t(o.status, lang)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <span>🌾 {o.crop_type}</span>
                    <span>📦 {o.quantity_quintals} qtl</span>
                    <span>💰 ₹{o.offered_price_per_quintal?.toLocaleString('en-IN')}/qtl</span>
                    <span>💵 Total: ₹{(o.offered_price_per_quintal * o.quantity_quintals).toLocaleString('en-IN')}</span>
                  </div>
                  {o.message && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 italic">
                      "{o.message}"
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Received: {new Date(o.created_at).toLocaleString('en-IN')}
                  </div>
                </div>

                {o.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => respond(o.id, 'accept')}
                      disabled={responding === o.id}
                      className="btn-success flex items-center gap-1 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {t('accept', lang)}
                    </button>
                    <button
                      onClick={() => respond(o.id, 'reject')}
                      disabled={responding === o.id}
                      className="btn-danger flex items-center gap-1 text-sm">
                      <XCircle className="w-4 h-4" />
                      {t('reject', lang)}
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
