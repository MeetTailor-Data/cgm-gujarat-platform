import React, { useEffect, useState } from 'react';
import api from '../../hooks/useApi';
import { RefreshCw, UserCheck, UserX } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [toggling, setToggling] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    const params = roleFilter ? `?role=${roleFilter}` : '';
    api.get(`/admin/users${params}`).then(r => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const toggleUser = async (id) => {
    setToggling(id);
    try {
      await api.post(`/admin/users/${id}/toggle`);
      fetchUsers();
    } finally {
      setToggling(null);
    }
  };

  const roleBadge = {
    farmer: 'bg-green-100 text-green-700',
    buyer: 'bg-blue-100 text-blue-700',
    admin: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">User Management</h1>
        <button onClick={fetchUsers} className="btn-secondary flex items-center gap-1 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-3">
        {['', 'farmer', 'buyer', 'admin'].map(r => (
          <button key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${roleFilter === r ? 'bg-orange-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading users...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Phone</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Joined</th>
                <th className="text-right py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 font-medium">{u.name}</td>
                  <td className="py-2 text-gray-600">{u.phone}</td>
                  <td className="py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => toggleUser(u.id)}
                      disabled={toggling === u.id || u.role === 'admin'}
                      className={`text-xs px-2 py-1 rounded ${u.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} disabled:opacity-40`}>
                      {u.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-gray-400 mt-3">{users.length} users</div>
        </div>
      )}
    </div>
  );
}
