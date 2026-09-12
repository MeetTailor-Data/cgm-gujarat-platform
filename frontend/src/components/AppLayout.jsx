import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n/translations';
import {
  LayoutDashboard, List, Plus, TrendingUp, Star, Package,
  BarChart3, ShoppingBag, FileText, Users, Settings,
  LogOut, Menu, X, Globe, Wheat, Brain
} from 'lucide-react';

const farmerNav = [
  { to: '/farmer', label: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/farmer/listings', label: 'myListings', icon: List },
  { to: '/farmer/add-crop', label: 'addCrop', icon: Plus },
  { to: '/farmer/mandi-prices', label: 'mandiPrices', icon: BarChart3 },
  { to: '/farmer/forecast', label: 'priceForecast', icon: TrendingUp },
  { to: '/farmer/quality-check', label: 'qualityCheck', icon: Star },
  { to: '/farmer/storage-advice', label: 'storageAdvice', icon: Package },
  { to: '/farmer/offers', label: 'myOffers', icon: ShoppingBag },
  { to: '/farmer/transactions', label: 'transactions', icon: FileText },
];

const buyerNav = [
  { to: '/buyer', label: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/buyer/requirements', label: 'requirements', icon: List },
  { to: '/buyer/browse', label: 'browseFarmers', icon: Wheat },
  { to: '/buyer/match', label: 'findBuyers', icon: Brain },
  { to: '/buyer/offers', label: 'myOffers', icon: ShoppingBag },
];

const adminNav = [
  { to: '/admin', label: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'users', icon: Users },
  { to: '/admin/market-data', label: 'marketData', icon: BarChart3 },
  { to: '/admin/transactions', label: 'transactions', icon: FileText },
  { to: '/admin/ai-logs', label: 'aiLogs', icon: Brain },
];

const navMap = { farmer: farmerNav, buyer: buyerNav, admin: adminNav };

const roleBadgeColors = {
  farmer: 'bg-green-100 text-green-800',
  buyer: 'bg-blue-100 text-blue-800',
  admin: 'bg-purple-100 text-purple-800',
};

export default function AppLayout({ role }) {
  const { user, logout, updateLanguage } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lang = user?.language || 'en';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLang = () => updateLanguage(lang === 'en' ? 'gu' : 'en');

  const navItems = navMap[role] || [];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center">
          <Wheat className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm text-gray-900">{t('appName', lang)}</div>
          <div className="text-xs text-gray-400">{t('appSubtitle', lang)}</div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="text-sm font-semibold text-gray-800">{user?.name}</div>
        <div className="text-xs text-gray-500 mt-0.5">{user?.phone}</div>
        <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeColors[role]}`}>
          {t(role, lang)}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                isActive
                  ? 'bg-orange-50 text-orange-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {t(item.label, lang)}
          </NavLink>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <button
          onClick={toggleLang}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Globe className="w-4 h-4" />
          {lang === 'en' ? 'ગુજરાતી' : 'English'}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('logout', lang)}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 z-50">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Wheat className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-gray-900 text-sm">{t('appName', lang)}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
