import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wheat, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.phone, form.password);
      if (user.role === 'farmer') navigate('/farmer');
      else if (user.role === 'buyer') navigate('/buyer');
      else navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { label: '🌾 Farmer (Ramesh Patel)', phone: '9876543210' },
    { label: '🏢 Buyer (Ashok Cotton)', phone: '9876500001' },
    { label: '⚙️ Admin', phone: '9000000000' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 rounded-2xl mb-4 shadow-lg">
            <Wheat className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CGM Gujarat Platform</h1>
          <p className="text-gray-500 mt-1">કોટન & મગફળી બજાર લિન્કેજ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Login / લૉગ ઇન</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number / ફોન નંબર
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input-field"
                placeholder="9876543210"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password / પાસવર્ડ
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-center py-2.5">
              {loading ? 'Logging in...' : 'Login / લૉગ ઇન'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-4">
            New user?{' '}
            <Link to="/register" className="text-orange-600 hover:underline font-medium">
              Register here / અહીં નોંધણી કરો
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">
            Demo Credentials (Password: password123)
          </p>
          <div className="space-y-1">
            {demoCredentials.map(d => (
              <button
                key={d.phone}
                onClick={() => setForm({ phone: d.phone, password: 'password123' })}
                className="w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
              >
                {d.label} – {d.phone}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by IBM Granite AI · IBM Cloud
        </p>
      </div>
    </div>
  );
}
