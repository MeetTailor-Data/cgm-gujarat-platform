import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wheat } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'farmer', language: 'en' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      if (user.role === 'farmer') navigate('/farmer');
      else if (user.role === 'buyer') navigate('/buyer');
      else navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 rounded-2xl mb-4 shadow-lg">
            <Wheat className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CGM Gujarat Platform</h1>
          <p className="text-gray-500 mt-1">Register / નોંધણી</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Create Account / ખાતું બનાવો</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name / પૂરું નામ</label>
              <input type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-field" placeholder="Your full name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone / ફોન</label>
              <input type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input-field" placeholder="10-digit mobile number" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password / પાસવર્ડ</label>
              <input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input-field" placeholder="Min 6 characters" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role / ભૂમિકા</label>
              <select value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="input-field">
                <option value="farmer">🌾 Farmer / ખેડૂત</option>
                <option value="buyer">🏢 Buyer / ખરીદદાર</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language / ભાષા</label>
              <select value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                className="input-field">
                <option value="en">English</option>
                <option value="gu">ગુજરાતી</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Creating account...' : 'Register / નોંધણી'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-4">
            Already registered?{' '}
            <Link to="/login" className="text-orange-600 hover:underline font-medium">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
