import React, { useEffect, useState } from 'react';
import api from '../../hooks/useApi';
import { RefreshCw } from 'lucide-react';

export default function AdminTransactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTxs = () => {
    setLoading(true);
    api.get('/admin/transactions').then(r => setTxs(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchTxs(); }, []);

  const total = txs.reduce((s, t) => s + t.total_amount, 0);
  const totalQty = txs.reduce((s, t) => s + t.quantity_quintals, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">All Transactions</h1>
        <button onClick={fetchTxs} className="btn-secondary flex items-center gap-1 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {txs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card bg-green-50 border-green-200">
            <div className="text-sm text-green-700 font-medium">Total Volume</div>
            <div className="text-2xl font-bold text-green-900">₹{total.toLocaleString('en-IN')}</div>
          </div>
          <div className="card bg-blue-50 border-blue-200">
            <div className="text-sm text-blue-700 font-medium">Total Qty Traded</div>
            <div className="text-2xl font-bold text-blue-900">{totalQty} qtl</div>
          </div>
          <div className="card bg-orange-50 border-orange-200">
            <div className="text-sm text-orange-700 font-medium">Total Deals</div>
            <div className="text-2xl font-bold text-orange-900">{txs.length}</div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : txs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No transactions yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2">Farmer</th>
                <th className="text-left py-2">Buyer</th>
                <th className="text-left py-2">Crop</th>
                <th className="text-right py-2">Qty (qtl)</th>
                <th className="text-right py-2">Price/qtl</th>
                <th className="text-right py-2">Total</th>
                <th className="text-right py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {txs.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2">{t.farmer_name}</td>
                  <td className="py-2">{t.buyer_name}</td>
                  <td className="py-2 capitalize">{t.crop_type}</td>
                  <td className="py-2 text-right">{t.quantity_quintals}</td>
                  <td className="py-2 text-right">₹{t.price_per_quintal}</td>
                  <td className="py-2 text-right font-semibold text-green-700">₹{t.total_amount.toLocaleString('en-IN')}</td>
                  <td className="py-2 text-right text-xs text-gray-400">{new Date(t.completed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
