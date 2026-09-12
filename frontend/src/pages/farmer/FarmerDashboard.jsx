import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import {
  TrendingUp, Package, ShoppingBag, IndianRupee, Plus,
  BarChart3, Star, Brain, ArrowRight, AlertCircle, FileText
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color = 'orange', sub }) {
  const colors = {
    orange: 'bg-orange-50 text-orange-700',
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai/income-dashboard')
      .then(r => setDashboard(r.data))
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>;

  const summary = dashboard?.summary || {};

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lang === 'gu' ? `નમસ્તે, ${user?.name}!` : `Welcome, ${user?.name}!`}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {lang === 'gu' ? 'તમારા ડૅશબૉર્ડ પર આપનું સ્વાગત છે' : 'Here\'s your market overview for today'}
          </p>
        </div>
        <Link to="/farmer/add-crop" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('addCrop', lang)}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label={t('totalEarned', lang)}
          value={`₹${(summary.total_earned || 0).toLocaleString('en-IN')}`} color="green" />
        <StatCard icon={Package} label={t('myListings', lang)}
          value={summary.active_listings || 0}
          sub={`${summary.total_pending_qty || 0} qtl pending`} color="blue" />
        <StatCard icon={ShoppingBag} label={t('pendingOffers', lang)}
          value={summary.pending_offers || 0} color="orange" />
        <StatCard icon={FileText} label={t('transactions', lang)}
          value={summary.total_transactions || 0} color="purple" />
      </div>

      {/* Market Prices Widget */}
      <div className="grid md:grid-cols-2 gap-4">
        {[['cotton', 'blue', '🔵'], ['groundnut', 'orange', '🟡']].map(([crop, color, icon]) => (
          <div key={crop} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span>{icon}</span>
                <span className="font-semibold text-gray-800 capitalize">
                  {t(crop, lang)}
                </span>
              </div>
              <Link to="/farmer/mandi-prices" className="text-xs text-orange-600 hover:underline flex items-center gap-1">
                {lang === 'gu' ? 'વધુ જુઓ' : 'View prices'} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ₹{(dashboard?.market_prices?.[crop] || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {lang === 'gu' ? 'ક્વિ. ભાવ (Gujarat Avg)' : 'Per Quintal · Gujarat Average'}
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      {dashboard?.ai_insights?.length > 0 && (
        <div className="ai-card">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">
              {lang === 'gu' ? 'AI સ્માર્ટ સલાહ' : 'AI Smart Insights'}
            </span>
            <span className="text-xs text-blue-500 ml-auto">{dashboard.powered_by}</span>
          </div>
          <div className="space-y-2">
            {dashboard.ai_insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="mt-0.5 flex-shrink-0">→</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">
          {lang === 'gu' ? 'ઝડપી ક્રિયાઓ' : 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/farmer/forecast', icon: TrendingUp, label: t('priceForecast', lang), color: 'text-blue-600 bg-blue-50' },
            { to: '/farmer/quality-check', icon: Star, label: t('qualityCheck', lang), color: 'text-yellow-600 bg-yellow-50' },
            { to: '/farmer/storage-advice', icon: Package, label: t('storageAdvice', lang), color: 'text-green-600 bg-green-50' },
            { to: '/farmer/mandi-prices', icon: BarChart3, label: t('mandiPrices', lang), color: 'text-orange-600 bg-orange-50' },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="card hover:shadow-md transition-shadow flex flex-col items-center gap-2 py-4 text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Pending Offers */}
      {summary.pending_offers > 0 && (
        <div className="card border-l-4 border-orange-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <div>
              <div className="font-semibold text-gray-800">
                {summary.pending_offers} {lang === 'gu' ? 'ઑફર બાકી છે' : 'pending offer(s) awaiting response'}
              </div>
              <div className="text-sm text-gray-500">
                {lang === 'gu' ? 'ઑફર સ્વીકારો અથવા નકારો' : 'Accept or reject buyer offers'}
              </div>
            </div>
            <Link to="/farmer/offers" className="ml-auto btn-primary text-sm">
              {lang === 'gu' ? 'ઑફર જુઓ' : 'View Offers'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
