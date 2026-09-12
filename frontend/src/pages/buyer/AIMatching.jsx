import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';
import { Brain, Send, X } from 'lucide-react';

const gradeBadge = {
  A: 'badge-grade-a', B: 'badge-grade-b', C: 'badge-grade-c',
  unknown: 'bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full inline-flex',
};

export default function AIMatching() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [reqs, setReqs] = useState([]);
  const [selectedReq, setSelectedReq] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offerModal, setOfferModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ offered_price_per_quintal: '', quantity_quintals: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState('');

  useEffect(() => {
    api.get('/buyer/requirements').then(r => setReqs(r.data.filter(r => r.status === 'open')));
  }, []);

  const runMatching = async () => {
    if (!selectedReq) return;
    setError(''); setLoading(true);
    try {
      const r = await api.post('/ai/match', { requirement_id: selectedReq });
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Matching failed');
    } finally {
      setLoading(false);
    }
  };

  const sendOffer = async () => {
    setSubmitting(true);
    try {
      await api.post('/buyer/offers', {
        listing_id: offerModal.listing.id,
        requirement_id: selectedReq,
        offered_price_per_quintal: parseFloat(offerForm.offered_price_per_quintal),
        quantity_quintals: parseFloat(offerForm.quantity_quintals),
        message: offerForm.message,
      });
      setOfferSuccess('Offer sent!');
      setOfferModal(null);
      setTimeout(() => setOfferSuccess(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-purple-600" />
        <h1 className="text-xl font-bold text-gray-900">AI Buyer-Farmer Matching</h1>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">IBM Granite AI</span>
      </div>

      <div className="card space-y-4">
        <p className="text-sm text-gray-600">
          Select one of your open requirements and let IBM Granite AI find the best matching farmers.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Requirement</label>
          <select value={selectedReq} onChange={e => setSelectedReq(e.target.value)} className="input-field">
            <option value="">-- Choose a requirement --</option>
            {reqs.map(r => (
              <option key={r.id} value={r.id}>
                {r.crop_type} · {r.quantity_quintals} qtl · Grade {r.min_quality}+ · Max ₹{r.max_price_per_quintal}/qtl
              </option>
            ))}
          </select>
          {reqs.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">No open requirements. Add requirements first.</p>
          )}
        </div>
        <button onClick={runMatching} disabled={loading || !selectedReq} className="btn-primary w-full flex items-center justify-center gap-2">
          <Brain className="w-4 h-4" />
          {loading ? 'AI is finding best matches...' : 'Find Matching Farmers with AI'}
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {offerSuccess && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{offerSuccess}</div>}

      {result && (
        <div className="space-y-4">
          {/* AI Summary */}
          {result.ai_summary && (
            <div className="ai-card">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">AI Analysis</span>
                <span className="text-xs text-blue-500 ml-auto">{result.powered_by}</span>
              </div>
              <p className="text-sm text-blue-800">{result.ai_summary}</p>
            </div>
          )}

          <div className="text-sm text-gray-600">
            Found <strong>{result.total_found}</strong> matching farmer{result.total_found !== 1 ? 's' : ''}
          </div>

          {/* Matches */}
          <div className="space-y-3">
            {result.matches.map((m, i) => (
              <div key={i} className={`card border-l-4 ${i === 0 ? 'border-green-500' : i === 1 ? 'border-blue-400' : 'border-gray-300'}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {i === 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">🏆 Best Match</span>}
                      <span className="font-semibold text-gray-900">{m.listing.farmer_name}</span>
                      <span className={gradeBadge[m.listing.quality_grade] || gradeBadge.unknown}>
                        Grade {m.listing.quality_grade}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        Match Score: {m.score}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span>📦 {m.listing.quantity_quintals} qtl</span>
                      <span>💰 ₹{m.listing.asking_price_per_quintal?.toLocaleString('en-IN') || '—'}/qtl</span>
                      <span>📍 {m.listing.district || '—'}</span>
                      <span>💧 {m.listing.moisture_pct?.toFixed(1) || '—'}% moisture</span>
                    </div>
                    {m.reasons?.length > 0 && (
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {m.reasons.slice(0, 3).map((r, ri) => (
                          <span key={ri} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setOfferModal(m);
                      setOfferForm({ offered_price_per_quintal: m.listing.asking_price_per_quintal || '', quantity_quintals: m.listing.quantity_quintals, message: '' });
                    }}
                    className="btn-primary text-sm flex items-center gap-1">
                    <Send className="w-4 h-4" /> Make Offer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Send Offer</h3>
              <button onClick={() => setOfferModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Price (₹/qtl)</label>
                <input type="number" value={offerForm.offered_price_per_quintal}
                  onChange={e => setOfferForm(f => ({ ...f, offered_price_per_quintal: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (qtl)</label>
                <input type="number" value={offerForm.quantity_quintals}
                  onChange={e => setOfferForm(f => ({ ...f, quantity_quintals: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={offerForm.message}
                  onChange={e => setOfferForm(f => ({ ...f, message: e.target.value }))}
                  className="input-field" rows={2} />
              </div>
              <div className="flex gap-3">
                <button onClick={sendOffer} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Sending...' : 'Send Offer'}
                </button>
                <button onClick={() => setOfferModal(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
