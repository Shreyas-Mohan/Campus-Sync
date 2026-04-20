import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Calendar, MessageSquare, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function Notifications() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [token]);

  const handleMarkAllRead = async () => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {
      toast.error('Failed to mark read');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'comment': return <MessageSquare size={16} color="var(--blue)" />;
      case 'new_event': return <Sparkles size={16} color="var(--purple)" />;
      case 'event_update': return <Calendar size={16} color="var(--blue)" />;
      default: return <Bell size={16} color="var(--muted)" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar title="Notifications" />
      <div style={S.container}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}><Bell size={24} style={{ color: 'var(--blue)' }} /> Notifications</h1>
            <p style={S.subtitle}>You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={S.markAllBtn}>
                <Check size={16} /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={handleClearAll} style={S.clearAllBtn}>
                <Trash2 size={16} /> Clear all
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={S.skeletonList}>
            {[1, 2, 3].map(i => (
              <div key={i} style={S.skeletonItem} className="skeleton" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div style={S.emptyBox}>
            <Bell size={48} style={{ color: 'var(--border2)' }} />
            <p style={S.emptyTitle}>All caught up!</p>
            <p style={S.emptySub}>No new notifications right now.</p>
          </div>
        ) : (
          <div style={S.list}>
            <AnimatePresence>
              {notifications.map(n => (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{...S.item, ...(n.read ? S.itemRead : S.itemUnread)}}
                  onClick={() => {
                    if (!n.read) handleMarkRead(n._id);
                    if (n.eventId) {
                      const hash = n.type === 'comment' ? '#comments' : '';
                      navigate(`/events/${n.eventId}${hash}`);
                    }
                  }}
                >
                  <div style={S.iconBox}>{getIcon(n.type)}</div>
                  <div style={S.contentBox}>
                    <p style={S.message}>{n.message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={S.time}>{new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      {n.eventId && (
                        <span style={S.viewLink}>
                          View event <ChevronRight size={12} style={{ display: 'inline' }} />
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.read && <div style={S.unreadDot} />}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  container: {
    maxWidth: 800, margin: '0 auto', padding: '120px 24px 60px',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, gap: 16, flexWrap: 'wrap'
  },
  title: {
    fontSize: 32, fontFamily: "'DM Serif Display', serif", color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
  },
  subtitle: {
    fontSize: 15, color: 'var(--muted)',
  },
  markAllBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(138,43,226, 0.1)', border: '1px solid rgba(138,43,226, 0.3)',
    color: 'var(--blue)', padding: '8px 16px', borderRadius: 99,
    fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
  },
  clearAllBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--muted)', padding: '8px 16px', borderRadius: 99,
    fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
  },
  list: {
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  item: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '16px 20px', borderRadius: 16,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    transition: 'all 0.2s', cursor: 'pointer', position: 'relative',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  itemUnread: {
    background: 'linear-gradient(to right, rgba(138,43,226,0.05), var(--bg2))',
    borderColor: 'rgba(138,43,226,0.3)',
  },
  itemRead: {
    opacity: 0.7,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: '50%', background: 'var(--bg3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  contentBox: {
    flex: 1, minWidth: 0,
  },
  message: {
    fontSize: 15, color: 'var(--text)', fontWeight: 500, marginBottom: 4,
  },
  time: {
    fontSize: 12, color: 'var(--muted)',
  },
  viewLink: {
    fontSize: 12, color: 'var(--blue)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', marginLeft: 8
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0,
    boxShadow: '0 0 8px var(--blue)'
  },
  emptyBox: {
    textAlign: 'center', padding: '80px 20px',
    background: 'var(--bg2)', borderRadius: 16, border: '1px dashed var(--border)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  emptyTitle: {
    fontSize: 20, fontWeight: 600, color: 'var(--text)',
  },
  emptySub: {
    fontSize: 15, color: 'var(--muted)',
  },
  skeletonList: { display: 'flex', flexDirection: 'column', gap: 12 },
  skeletonItem: { height: 72, borderRadius: 16, background: 'var(--bg2)', border: '1px solid var(--border)' }
};