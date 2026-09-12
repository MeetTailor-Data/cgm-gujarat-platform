import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';

export default function BuyerOffers() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/buyer/offers').then(r => setOffers(r.data)).finally(() => setLoading(false));
  }, []);

  const statusBadge = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-800',
    expired: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">{t('myOffers', lang)}</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📤</div>
          <div className="text-gray-500">No offers sent yet. Browse farmer listings to make offers.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(o => (
            <div key={o.id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-gray-900">{o.farmer_name}</span>
                    {o.farmer_district && <span className="text-sm text-gray-500">({o.farmer_district})</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {t(o.status, lang)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <span>🌾 {o.crop_type}</span>
                    <span>📦 {o.quantity_quintals} qtl</span>
                    <span>💰 ₹{o.offered_price_per_quintal?.toLocaleString('en-IN')}/qtl</span>
                    <span>💵 ₹{(o.offered_price_per_quintal * o.quantity_quintals).toLocaleString('en-IN')}</span>
                  </div>
                  {o.status === 'accepted' && (
                    <div className="mt-2 flex items-center gap-2 text-green-700 text-sm font-medium">
                      ✅ Farmer accepted! Proceed to complete the transaction.
                    </div>
                  )}
                  {o.status === 'rejected' && (
                    <div className="mt-2 text-red-600 text-sm">
                      ❌ Farmer rejected this offer. You can browse other listings.
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Sent: {new Date(o.created_at).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
