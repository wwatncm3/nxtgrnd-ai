import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeft, UserPlus, Trash2, RefreshCw, Shield, Check, X } from 'lucide-react';
import { UserContext } from '../App';
import { useSubscription } from '../contexts/SubscriptionContext';
import API_CONFIG from '../config/api';

const AdminPage = ({ setStage }) => {
  const { user } = useContext(UserContext);
  const { isAdmin } = useSubscription();

  const [betaUsers, setBetaUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const betaEndpoint = API_CONFIG.subscription.checkBetaAccess();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBetaUsers = async () => {
    if (!betaEndpoint) return;
    setLoading(true);
    try {
      const res = await fetch(`${betaEndpoint}/list?adminEmail=${encodeURIComponent(user?.email)}`);
      const data = await res.json();
      setBetaUsers(data.users || []);
    } catch (err) {
      showToast('Failed to load beta users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchBetaUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleApprove = async () => {
    if (!newEmail.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(betaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          action: 'approve',
          adminEmail: user?.email
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Beta access approved for ${newEmail}`);
        setNewEmail('');
        fetchBetaUsers();
      } else {
        showToast(data.error || 'Failed to approve', 'error');
      }
    } catch (err) {
      showToast('Failed to approve user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (email) => {
    if (!window.confirm(`Revoke beta access for ${email}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(betaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          action: 'revoke',
          adminEmail: user?.email
        })
      });
      if (res.ok) {
        showToast(`Beta access revoked for ${email}`);
        fetchBetaUsers();
      } else {
        showToast('Failed to revoke', 'error');
      }
    } catch (err) {
      showToast('Failed to revoke user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 mt-2">Admin access only.</p>
          <button onClick={() => setStage(5)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium
          ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.type === 'error' ? <X size={16} /> : <Check size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => setStage(5)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">Admin — Beta Access</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Approve New User */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            Approve Beta User
          </h2>
          <div className="flex gap-3">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApprove()}
              placeholder="user@example.com"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleApprove}
              disabled={actionLoading || !newEmail.trim()}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Approve
            </button>
          </div>
        </div>

        {/* Beta Users List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Beta Users <span className="text-sm font-normal text-gray-500">({betaUsers.length})</span>
            </h2>
            <button
              onClick={fetchBetaUsers}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
          ) : betaUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No beta users yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {betaUsers.map(u => (
                <div key={u.email} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.email}</p>
                    <p className="text-xs text-gray-400">
                      Approved {u.approvedAt ? new Date(u.approvedAt).toLocaleDateString() : '—'}
                      {u.approvedBy ? ` by ${u.approvedBy}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(u.email)}
                    disabled={actionLoading}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Revoke access"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
