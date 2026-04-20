import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, MailWarning } from 'lucide-react';

export default function PendingInvites() {
  const { token, user } = useAuth();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/team/my-invites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvites(data);
    } catch {
      toast.error('Failed to load invites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInvites();
  }, [token]);

  const handleRespond = async (inviteId, action) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/team/invite/${inviteId}/respond`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Invite ${action}ed`);
      setInvites(invites.filter(i => i._id !== inviteId));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Action failed');
    }
  };

  if (loading || invites.length === 0) return null;

  return (
    <div style={S.container}>
      <div style={S.header}>
        <MailWarning size={20} color="var(--purple)" />
        <h3 style={S.title}>Club Invitations</h3>
      </div>
      <p style={S.subtitle}>You have been invited to manage these clubs:</p>

      <div style={S.list}>
        {invites.map(inv => (
          <div key={inv._id} style={S.card}>
            <div style={S.clubInfo}>
              <div style={S.avatar}>{inv.club?.name?.[0]}</div>
              <div>
                <h4 style={S.clubName}>{inv.club?.name}</h4>
                <p style={S.role}>Role: {inv.role.replace('_', ' ')}</p>
              </div>
            </div>
            <div style={S.actions}>
              <button onClick={() => handleRespond(inv._id, 'accept')} style={S.acceptBtn}>
                <CheckCircle size={16} /> Accept
              </button>
              <button onClick={() => handleRespond(inv._id, 'reject')} style={S.rejectBtn}>
                <XCircle size={16} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const S = {
  container: { marginTop: 24, padding: 24, background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--purple)', boxShadow: '0 4px 15px rgba(138,43,226,0.1)' },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 600, color: 'var(--text)' },
  subtitle: { fontSize: 14, color: 'var(--muted)', marginBottom: 16 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' },
  clubInfo: { display: 'flex', gap: 12, alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  clubName: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },
  role: { fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' },
  actions: { display: 'flex', gap: 8 },
  acceptBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  rejectBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }
};