import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n/translations';
import api from '../../hooks/useApi';

export default function FarmerTransactions() {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/farmer/transactions').then(r => setTxs(r.data)).finally(() => setLoading(false));
  }, []);

  const total = txs.reduce((s, t) => s + t.total_amount, 0);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">{t('transactions', lang)}</h1>

      {txs.length > 0 && (
        <div className="card bg-green-50 border-green-200">
          <div className="text-sm text-green-700 font-medium">Total Earnings</div>
          <div className="text-3xl font-bold text-green-900">₹{total.toLocaleString('en-IN')}</div>
          <div className="text-sm text-green-600">{txs.length} transactions completed</div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : txs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">💰</div>
          <div className="text-gray-500">No transactions yet.</div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2">Buyer</th>
                <th className="text-left py-2">Crop</th>
                <th className="text-right py-2">Qty (qtl)</th>
                <th className="text-right py-2">Price/qtl</th>
                <th className="text-right py-2">Total</th>
                <th className="text-right py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {txs.map(tx => (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 font-medium">{tx.buyer_name}</td>
                  <td className="py-2 capitalize">{tx.crop_type}</td>
                  <td className="py-2 text-right">{tx.quantity_quintals}</td>
                  <td className="py-2 text-right">₹{tx.price_per_quintal}</td>
                  <td className="py-2 text-right font-semibold text-green-700">
                    ₹{tx.total_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 text-right text-gray-400 text-xs">
                    {new Date(tx.completed_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={4} className="py-2 font-semibold text-right text-gray-700">Total:</td>
                <td className="py-2 text-right font-bold text-green-700 text-lg">
                  ₹{total.toLocaleString('en-IN')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
