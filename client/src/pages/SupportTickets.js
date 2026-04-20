import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { HelpCircle, PlusCircle, CheckCircle, Clock, X, MessageSquare, Briefcase, Bug } from 'lucide-react';

export default function SupportTickets() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'bug'
  });

  const fetchTickets = async () => {
    try {
      // Normal user fetches their own tickets. Admin fetches all tickets.
      const url = user?.role === 'admin' ? '/api/tickets/all' : '/api/tickets';
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(data);
    } catch {
      toast.error('Failed to load tickets');
    }
  };

  useEffect(() => {
    if (token) fetchTickets();
  }, [token, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tickets`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Ticket submitted successfully!');
      setModal(false);
      setForm({ title: '', description: '', category: 'bug' });
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'var(--purple)';
      case 'in_progress': return 'var(--blue)';
      case 'resolved': return 'var(--green)';
      default: return 'var(--muted)';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      default: return 'Closed';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'bug': return <Bug size={16} />;
      case 'feature_request': return <MessageSquare size={16} />;
      case 'club_sponsorship': return <Briefcase size={16} />;
      default: return <HelpCircle size={16} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar title="Support & Feedback" />
      <div style={S.container}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}><HelpCircle size={28} style={{ color: 'var(--blue)' }} /> Helpdesk</h1>
            <p style={S.subtitle}>Report bugs, suggest features, or connect with campus administration.</p>
          </div>
          {user?.role !== 'admin' && (
            <button onClick={() => setModal(true)} style={S.createBtn}>
              <PlusCircle size={16} /> New Ticket
            </button>
          )}
        </div>

        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <div style={S.emptyState}>
            <HelpCircle size={48} style={{ color: 'var(--border)' }} />
            <p style={S.emptyTitle}>No active tickets</p>
            <p style={S.emptySub}>If you have a problem or suggestion, create a new ticket!</p>
          </div>
        ) : (
          <div style={S.grid}>
            {tickets.map(t => (
              <motion.div key={t._id} style={S.card} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={S.cardHeader}>
                  <div style={S.catBadge}>
                    {getCategoryIcon(t.category)} {t.category.replace('_', ' ')}
                  </div>
                  <div style={{...S.statusBadge, border: `1px solid ${getStatusColor(t.status)}`, color: getStatusColor(t.status) }}>
                    {getStatusLabel(t.status)}
                  </div>
                </div>
                
                <h3 style={S.cardTitle}>{t.title}</h3>
                <p style={S.cardDesc}>{t.description}</p>
                
                {t.adminReply && (
                  <div style={S.replyBox}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', marginBottom: 4 }}>Admin Reply:</p>
                    <p style={{ fontSize: 13, color: 'var(--text)' }}>{t.adminReply}</p>
                  </div>
                )}
                
                <div style={S.footer}>
                  <span>Submitted on {new Date(t.createdAt).toLocaleDateString()}</span>
                  {user?.role === 'admin' && <span>By: {t.user?.name || 'Student'}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div style={S.overlay} onClick={() => setModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHead}>
              <div>
                <h2 style={S.modalTitle}>Open a Ticket</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Let us know how we can help you.</p>
              </div>
              <button onClick={() => setModal(false)} style={S.closeBtn}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={S.form}>
              <div style={S.field}>
                <label style={S.label}>Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={S.input}>
                  <option value="bug">Report a Bug</option>
                  <option value="feature_request">Feature Request / Feedback</option>
                  {user?.role === 'club' && <option value="club_sponsorship">Club Support / Sponsorship</option>}
                  <option value="other">Other Inquiry</option>
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Title</label>
                <input 
                  placeholder="e.g., Cannot upload poster" 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  required style={S.input} 
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Description</label>
                <textarea 
                  rows={5} 
                  placeholder="Please provide details about your issue or suggestion..." 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  required style={{...S.input, resize: 'vertical'}} 
                />
              </div>

              <button type="submit" disabled={submitting} style={S.submitBtn}>
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  container: { maxWidth: 1000, margin: '0 auto', padding: '100px 24px 60px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  title: { fontSize: 32, fontFamily: "'DM Serif Display', serif", color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'var(--muted)' },
  createBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(59,130,246,0.3)', },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  catBadge: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'capitalize' },
  statusBadge: { padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  cardTitle: { fontSize: 18, color: 'var(--text)', fontWeight: 600, marginBottom: 8 },
  cardDesc: { fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, flex: 1, marginBottom: 16 },
  replyBox: { background: 'rgba(59,130,246, 0.05)', borderLeft: '3px solid var(--blue)', padding: '12px 16px', borderRadius: '4px 8px 8px 4px', marginBottom: 16 },
  footer: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 16 },
  emptyState: { textAlign: 'center', padding: '80px 24px', background: 'var(--bg2)', borderRadius: 16, border: '1px dashed var(--border)' },
  emptyTitle: { fontSize: 20, color: 'var(--text)', fontWeight: 600, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 15, color: 'var(--muted)' },
  
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' },
  modal: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 500 },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontFamily: "'DM Serif Display', serif", color: 'var(--text)', marginBottom: 4 },
  closeBtn: { background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: 8, borderRadius: 8, cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, fontSize: 15, outline: 'none' },
  submitBtn: { padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 600, marginTop: 8, cursor: 'pointer' }
};