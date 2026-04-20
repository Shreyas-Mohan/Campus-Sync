import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Users, Mail, Settings, UserMinus, PlusCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeamManagement() {
  const { user, token } = useAuth();
  const [managers, setManagers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ email: '', role: 'event_manager' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTeam = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/team/club/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(data.managers || []);
      setInvites(data.invites || []);
    } catch {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user.role === 'club') {
      fetchTeam();
    }
  }, [token, user]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/team/invite`, {
        clubId: user.id, ...form
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invite sent successfully');
      setForm({ email: '', role: 'event_manager' });
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send invite');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveManager = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this manager?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/team/club/${user.id}/member/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Manager removed');
      fetchTeam();
    } catch {
      toast.error('Failed to remove manager');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return { bg: 'var(--red)20', color: 'var(--red)', label: 'Admin' };
      case 'editor': return { bg: 'var(--blue)20', color: 'var(--blue)', label: 'Editor' };
      default: return { bg: 'var(--purple)20', color: 'var(--purple)', label: 'Event Manager' };
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={S.sectionTitle}><Users size={20} /> Team Management</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Add co-organizers to your club to help manage events, posts, and details.</p>

      {/* Invite Form */}
      <div style={S.inviteBox}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Invite New Manager</h3>
        <form onSubmit={handleInvite} style={S.form}>
          <div style={{ flex: 2 }}>
            <input 
              type="email" 
              placeholder="Student's email address" 
              required 
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={S.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <select 
              value={form.role} 
              onChange={e => setForm({ ...form, role: e.target.value })} 
              style={S.input}
            >
              <option value="event_manager">Event Manager</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} style={S.inviteBtn}>
            <Mail size={16} /> {submitting ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      <div style={S.grid}>
        {/* Active Managers */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>Active Managers ({managers.length})</h3>
          {managers.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No active managers yet.</p>
          ) : (
            <div style={S.list}>
              {managers.map(m => {
                const rb = getRoleBadge(m.role);
                return (
                  <motion.div key={m.user?._id || Math.random()} style={S.listItem} initial={{opacity:0}} animate={{opacity:1}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={S.avatar}>{m.user?.name?.[0] || 'U'}</div>
                      <div>
                        <p style={{ fontWeight: 600 }}>{m.user?.name || 'Unknown User'}</p>
                        <p style={{ fontSize: 12, color: 'var(--muted)' }}>{m.user?.email || ''}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: rb.bg, color: rb.color }}>
                        {rb.label}
                      </span>
                      <button onClick={() => handleRemoveManager(m.user?._id)} style={S.iconBtn} title="Remove Manager">
                        <Trash2 size={16} color="var(--red)" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pending Invites */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>Pending Invites ({invites.length})</h3>
          {invites.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No pending invites.</p>
          ) : (
            <div style={S.list}>
              {invites.map(inv => {
                const rb = getRoleBadge(inv.role);
                return (
                  <div key={inv._id} style={S.listItem}>
                    <div>
                      <p style={{ fontWeight: 600 }}>{inv.email}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)' }}>Sent on {new Date(inv.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: rb.bg, color: rb.color }}>
                      {rb.label} (Pending)
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  sectionTitle: { fontSize: 24, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' },
  inviteBox: { background: 'var(--bg2)', padding: 24, borderRadius: 16, border: '1px solid var(--border)', marginBottom: 24 },
  form: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  input: { width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none' },
  inviteBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 24px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', height: 44, whiteSpace: 'nowrap' },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 },
  card: { background: 'var(--bg2)', padding: 24, borderRadius: 16, border: '1px solid var(--border)' },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, padding: 4 }
};