import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../hooks/useApi';
import { Users, FileText, BarChart3, Brain, TrendingUp, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api.get('/admin/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchStats(); }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading admin dashboard...</div>;

  const cards = [
    { label: 'Farmers', value: stats?.farmers, icon: Users, color: 'green', link: '/admin/users?role=farmer' },
    { label: 'Buyers', value: stats?.buyers, icon: Users, color: 'blue', link: '/admin/users?role=buyer' },
    { label: 'Active Listings', value: stats?.listings, icon: FileText, color: 'orange', link: '/admin/market-data' },
    { label: 'Transactions', value: stats?.transactions, icon: BarChart3, color: 'purple', link: '/admin/transactions' },
    { label: 'Pending Offers', value: stats?.pending_offers, icon: TrendingUp, color: 'yellow', link: '/admin/transactions' },
    { label: 'Total Volume', value: `₹${(stats?.total_volume || 0).toLocaleString('en-IN')}`, icon: BarChart3, color: 'teal', link: '/admin/transactions' },
    { label: 'Cotton Listings', value: stats?.cotton_listings, icon: FileText, color: 'blue' },
    { label: 'Groundnut Listings', value: stats?.groundnut_listings, icon: FileText, color: 'yellow' },
  ];

  const colorMap = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    teal: 'bg-teal-50 text-teal-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">CGM Gujarat Platform Management</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[c.color]}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{c.value ?? 0}</div>
            <div className="text-sm text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Manage Platform</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/admin/users', icon: Users, label: 'Manage Users', color: 'text-blue-600 bg-blue-50' },
            { to: '/admin/market-data', icon: BarChart3, label: 'Market Data', color: 'text-orange-600 bg-orange-50' },
            { to: '/admin/transactions', icon: FileText, label: 'Transactions', color: 'text-green-600 bg-green-50' },
            { to: '/admin/ai-logs', icon: Brain, label: 'AI Logs', color: 'text-purple-600 bg-purple-50' },
          ].map(a => (
            <Link key={a.to} to={a.to} className="card hover:shadow-md transition-shadow flex flex-col items-center gap-2 py-5 text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
