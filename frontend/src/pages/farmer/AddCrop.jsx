import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import { Upload, CheckCircle } from 'lucide-react';

const DISTRICTS = ['Rajkot', 'Junagadh', 'Bhavnagar', 'Amreli', 'Jamnagar', 'Surendranagar', 'Morbi', 'Porbandar', 'Gir Somnath', 'Botad'];

export default function AddCrop() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const navigate = useNavigate();
  const [form, setForm] = useState({
    crop_type: 'cotton', quantity_quintals: '', asking_price_per_quintal: '',
    quality_grade: 'unknown', moisture_pct: '', village: '', taluka: '',
    district: 'Rajkot', harvest_date: '', available_until: '', quality_notes: '',
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (image) fd.append('image', image);
      await api.post('/farmer/listings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true);
      setTimeout(() => navigate('/farmer/listings'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add listing');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <CheckCircle className="w-16 h-16 text-green-500" />
      <div className="text-xl font-bold text-green-700">
        {lang === 'gu' ? 'પાક ઉમેર્યો!' : 'Crop listing added successfully!'}
      </div>
      <div className="text-gray-500">Redirecting to your listings...</div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">{t('addCrop', lang)}</h1>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cropType', lang)} *</label>
            <select value={form.crop_type}
              onChange={e => setForm(f => ({ ...f, crop_type: e.target.value }))}
              className="input-field">
              <option value="cotton">🔵 {t('cotton', lang)}</option>
              <option value="groundnut">🟡 {t('groundnut', lang)}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('qualityGrade', lang)}</label>
            <select value={form.quality_grade}
              onChange={e => setForm(f => ({ ...f, quality_grade: e.target.value }))}
              className="input-field">
              <option value="unknown">Not graded</option>
              <option value="A">Grade A – Premium</option>
              <option value="B">Grade B – Standard</option>
              <option value="C">Grade C – Basic</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('quantity', lang)} *</label>
            <input type="number" min="1" value={form.quantity_quintals}
              onChange={e => setForm(f => ({ ...f, quantity_quintals: e.target.value }))}
              className="input-field" placeholder="e.g. 50" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('price', lang)}</label>
            <input type="number" min="0" value={form.asking_price_per_quintal}
              onChange={e => setForm(f => ({ ...f, asking_price_per_quintal: e.target.value }))}
              className="input-field" placeholder="e.g. 6200" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('moisture', lang)}</label>
            <input type="number" step="0.1" min="0" max="30" value={form.moisture_pct}
              onChange={e => setForm(f => ({ ...f, moisture_pct: e.target.value }))}
              className="input-field" placeholder="e.g. 9.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('district', lang)} *</label>
            <select value={form.district}
              onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
              className="input-field">
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('village', lang)}</label>
            <input type="text" value={form.village}
              onChange={e => setForm(f => ({ ...f, village: e.target.value }))}
              className="input-field" placeholder="Your village" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('taluka', lang)}</label>
            <input type="text" value={form.taluka}
              onChange={e => setForm(f => ({ ...f, taluka: e.target.value }))}
              className="input-field" placeholder="Taluka name" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
            <input type="date" value={form.harvest_date}
              onChange={e => setForm(f => ({ ...f, harvest_date: e.target.value }))}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available Until</label>
            <input type="date" value={form.available_until}
              onChange={e => setForm(f => ({ ...f, available_until: e.target.value }))}
              className="input-field" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quality Notes</label>
          <textarea value={form.quality_notes}
            onChange={e => setForm(f => ({ ...f, quality_notes: e.target.value }))}
            className="input-field" rows={2}
            placeholder="Any additional quality information..." />
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Crop Photo (optional – used for AI quality grading)
          </label>
          <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-lg p-4 transition-colors">
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              {image ? image.name : 'Click to upload crop image (max 5MB)'}
            </span>
            <input type="file" accept="image/*" className="hidden"
              onChange={e => setImage(e.target.files[0])} />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Adding...' : (lang === 'gu' ? 'પાક ઉમેરો' : 'Add Crop Listing')}
          </button>
          <button type="button" onClick={() => navigate('/farmer/listings')} className="btn-secondary">
            {t('cancel', lang)}
          </button>
        </div>
      </form>
    </div>
  );
}
