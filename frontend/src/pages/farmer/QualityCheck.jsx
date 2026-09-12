import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import { Upload, Brain, Star, CheckCircle, AlertTriangle } from 'lucide-react';

export default function QualityCheck() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [form, setForm] = useState({ crop_type: 'cotton', manual_notes: '', listing_id: '' });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('crop_type', form.crop_type);
      if (form.manual_notes) fd.append('manual_notes', form.manual_notes);
      if (form.listing_id) fd.append('listing_id', form.listing_id);
      if (image) fd.append('image', image);
      const r = await api.post('/ai/quality-grade', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Quality check failed');
    } finally {
      setLoading(false);
    }
  };

  const gradeColors = {
    A: { card: 'bg-green-50 border-green-300', badge: 'badge-grade-a', icon: CheckCircle, iconColor: 'text-green-600' },
    B: { card: 'bg-yellow-50 border-yellow-300', badge: 'badge-grade-b', icon: Star, iconColor: 'text-yellow-600' },
    C: { card: 'bg-red-50 border-red-300', badge: 'badge-grade-c', icon: AlertTriangle, iconColor: 'text-red-600' },
  };
  const gc = result ? gradeColors[result.grade] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Star className="w-6 h-6 text-yellow-500" />
        <h1 className="text-xl font-bold text-gray-900">{t('qualityCheck', lang)}</h1>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          IBM Granite AI
        </span>
      </div>

      <div className="card space-y-4">
        <p className="text-sm text-gray-600">
          {lang === 'gu'
            ? 'AI ક્વોલિટી ગ્રેડ મેળવવા પાકની ફોટો અથવા ક્વોલિટી નોટ્સ ઉમેરો'
            : 'Upload a crop photo or describe your crop to get an AI-powered quality grade (A/B/C).'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cropType', lang)}</label>
            <select value={form.crop_type}
              onChange={e => setForm(f => ({ ...f, crop_type: e.target.value }))}
              className="input-field">
              <option value="cotton">{t('cotton', lang)}</option>
              <option value="groundnut">{t('groundnut', lang)}</option>
            </select>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crop Photo / પાકની ફોટો
            </label>
            <label className="flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-xl p-6 transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Crop" className="w-full max-h-48 object-cover rounded-lg" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload crop image</span>
                  <span className="text-xs text-gray-400">JPG, PNG up to 5MB</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality Notes / ક્વોલિટી વિગત
            </label>
            <textarea value={form.manual_notes}
              onChange={e => setForm(f => ({ ...f, manual_notes: e.target.value }))}
              className="input-field" rows={3}
              placeholder="Describe color, fiber length, moisture, damage if any..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <Brain className="w-4 h-4" />
            {loading ? 'Analyzing with AI...' : (lang === 'gu' ? 'AI ગ્રેડ મેળવો' : 'Get AI Quality Grade')}
          </button>
        </form>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {result && gc && (
        <div className={`border-2 rounded-xl p-5 ${gc.card}`}>
          <div className="flex items-center gap-4 mb-4">
            <gc.icon className={`w-10 h-10 ${gc.iconColor}`} />
            <div>
              <div className="text-2xl font-bold text-gray-900">{result.grade_label}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className={gc.badge}>{result.grade}</span>
                <span className="text-sm text-gray-600">Confidence: {result.confidence}%</span>
                <span className={`text-sm font-semibold ${result.price_impact?.startsWith('+') ? 'text-green-600' : result.price_impact?.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                  Price impact: {result.price_impact}
                </span>
              </div>
            </div>
          </div>

          {result.criteria_met && (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-1">Criteria Met:</div>
              <div className="text-sm text-gray-600">{result.criteria_met}</div>
            </div>
          )}

          {result.recommendations?.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Recommendations:</div>
              <ul className="space-y-1">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5">→</span><span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-400">{result.powered_by} · {result.analyzed_at}</div>
        </div>
      )}
    </div>
  );
}
