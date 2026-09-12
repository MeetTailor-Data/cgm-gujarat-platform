import React, { useEffect, useState } from 'react';
import api from '../../hooks/useApi';
import { Brain, RefreshCw } from 'lucide-react';

const agentColors = {
  mandiForecasting: 'bg-blue-100 text-blue-700',
  buyerFarmerMatching: 'bg-purple-100 text-purple-700',
  storageAdvisor: 'bg-green-100 text-green-700',
  qualityGrading: 'bg-yellow-100 text-yellow-700',
  incomeDashboard: 'bg-orange-100 text-orange-700',
};

export default function AdminAILogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    api.get('/admin/ai-logs').then(r => setLogs(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchLogs(); }, []);

  const agentCount = logs.reduce((acc, l) => {
    acc[l.agent] = (acc[l.agent] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl font-bold text-gray-900">AI Agent Logs</h1>
        </div>
        <button onClick={fetchLogs} className="btn-secondary flex items-center gap-1 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Agent activity summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(agentCount).map(([agent, count]) => (
          <div key={agent} className="card text-center">
            <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-2 ${agentColors[agent] || 'bg-gray-100 text-gray-600'}`}>
              {agent}
            </div>
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-xs text-gray-400">calls</div>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <h3 className="font-semibold text-gray-800 mb-3">Recent AI Agent Activity (last 50)</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No AI activity yet. Use AI features to generate logs.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2">Agent</th>
                <th className="text-left py-2">Input</th>
                <th className="text-left py-2">Output</th>
                <th className="text-right py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${agentColors[l.agent] || 'bg-gray-100 text-gray-600'}`}>
                      {l.agent}
                    </span>
                  </td>
                  <td className="py-2 text-gray-600 max-w-xs truncate">{l.input_summary}</td>
                  <td className="py-2 text-gray-600 max-w-xs truncate">{l.output_summary}</td>
                  <td className="py-2 text-right text-xs text-gray-400">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
