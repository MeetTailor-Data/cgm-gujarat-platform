import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Farmer pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerListings from './pages/farmer/FarmerListings';
import AddCrop from './pages/farmer/AddCrop';
import MandiPrices from './pages/farmer/MandiPrices';
import PriceForecast from './pages/farmer/PriceForecast';
import QualityCheck from './pages/farmer/QualityCheck';
import StorageAdvice from './pages/farmer/StorageAdvice';
import FarmerOffers from './pages/farmer/FarmerOffers';
import FarmerTransactions from './pages/farmer/FarmerTransactions';

// Buyer pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerRequirements from './pages/buyer/BuyerRequirements';
import BrowseListings from './pages/buyer/BrowseListings';
import BuyerOffers from './pages/buyer/BuyerOffers';
import AIMatching from './pages/buyer/AIMatching';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMarketData from './pages/admin/AdminMarketData';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminAILogs from './pages/admin/AdminAILogs';

// Layout
import AppLayout from './components/AppLayout';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500 text-lg">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'farmer') return <Navigate to="/farmer" replace />;
  if (user.role === 'buyer') return <Navigate to="/buyer" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Farmer Routes */}
          <Route path="/farmer" element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <AppLayout role="farmer" />
            </ProtectedRoute>
          }>
            <Route index element={<FarmerDashboard />} />
            <Route path="listings" element={<FarmerListings />} />
            <Route path="add-crop" element={<AddCrop />} />
            <Route path="mandi-prices" element={<MandiPrices />} />
            <Route path="forecast" element={<PriceForecast />} />
            <Route path="quality-check" element={<QualityCheck />} />
            <Route path="storage-advice" element={<StorageAdvice />} />
            <Route path="offers" element={<FarmerOffers />} />
            <Route path="transactions" element={<FarmerTransactions />} />
          </Route>

          {/* Buyer Routes */}
          <Route path="/buyer" element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <AppLayout role="buyer" />
            </ProtectedRoute>
          }>
            <Route index element={<BuyerDashboard />} />
            <Route path="requirements" element={<BuyerRequirements />} />
            <Route path="browse" element={<BrowseListings />} />
            <Route path="offers" element={<BuyerOffers />} />
            <Route path="match" element={<AIMatching />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout role="admin" />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="market-data" element={<AdminMarketData />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="ai-logs" element={<AdminAILogs />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
