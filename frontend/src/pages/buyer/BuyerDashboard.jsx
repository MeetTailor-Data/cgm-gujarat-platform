import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import { Plus, ShoppingBag, FileText, BarChart3, Brain, ArrowRight } from 'lucide-react';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [reqs, setReqs] = useState([]);
  const [offers, setOffers] = useState([]);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/buyer/requirements'),
      api.get('/buyer/offers'),
      api.get('/buyer/transactions'),
    ]).then(([r, o, t]) => {
      setReqs(r.data);
      setOffers(o.data);
      setTxs(t.data);
    }).finally(() => setLoading(false));
  }, []);

  const totalSpent = txs.reduce((s, t) => s + t.total_amount, 0);
  const pendingOffers = offers.filter(o => o.status === 'pending').length;
  const acceptedOffers = offers.filter(o => o.status === 'accepted').length;
  const openReqs = reqs.filter(r => r.status === 'open').length;

  const stats = [
    { label: 'Open Requirements', value: openReqs, icon: FileText, color: 'blue' },
    { label: 'Pending Offers', value: pendingOffers, icon: ShoppingBag, color: 'orange' },
    { label: 'Accepted Deals', value: acceptedOffers, icon: BarChart3, color: 'green' },
    { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, icon: FileText, color: 'purple' },
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-gray-500 text-sm mt-1">Buyer Dashboard – Find quality crops from Gujarat farmers</p>
        </div>
        <Link to="/buyer/requirements" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('addRequirement', lang)}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[s.color]}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/buyer/requirements', icon: Plus, label: 'Add Requirement', color: 'text-blue-600 bg-blue-50' },
            { to: '/buyer/browse', icon: ShoppingBag, label: t('browseFarmers', lang), color: 'text-green-600 bg-green-50' },
            { to: '/buyer/match', icon: Brain, label: 'AI Matching', color: 'text-purple-600 bg-purple-50' },
            { to: '/buyer/offers', icon: FileText, label: t('myOffers', lang), color: 'text-orange-600 bg-orange-50' },
          ].map(a => (
            <Link key={a.to} to={a.to} className="card hover:shadow-md transition-shadow flex flex-col items-center gap-2 py-4 text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Requirements */}
      {reqs.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Recent Requirements</h3>
            <Link to="/buyer/requirements" className="text-sm text-orange-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {reqs.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium capitalize">{r.crop_type}</span>
                  <span className="text-gray-500 ml-2">{r.quantity_quintals} qtl · Max ₹{r.max_price_per_quintal}/qtl</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
