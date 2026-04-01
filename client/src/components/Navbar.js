import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Bell, Zap, RefreshCw, CheckCheck, Moon, Sun } from 'lucide-react';

const API = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

/* ─── NotificationBell ─── */
function NotificationBell({ token }) {
  const navigate = useNavigate();
  const [notifs,  setNotifs]  = useState([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const unread = notifs.filter(n => !n.read).length;

  const fetchNotifs = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs(data);
    } catch {}
  }, [token]);

  // Poll every 15 s
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 15000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await axios.patch(`${API}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const markOneRead = async (id) => {
    try {
      await axios.patch(`${API}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) fetchNotifs();
  };

  const typeIcon  = (type) => type === 'comment' ? '💬' : '📢';
  const timeAgo   = (d) => {
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        style={{
          ...BS.iconBtn,
          ...(open ? { background: "var(--blue-dim)", borderColor: "var(--blue-border)", color: "var(--blue)" } : {}),
        }}
        aria-label="Notifications"
        onClick={handleOpen}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span style={BS.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={BS.panel}>
          {/* Header */}
          <div style={BS.panelHead}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={14} color="var(--blue)" />
              <span style={BS.panelTitle}>Notifications</span>
              {unread > 0 && <span style={BS.unreadBadge}>{unread} new</span>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={BS.headBtn} onClick={fetchNotifs} title="Refresh">
                <RefreshCw size={12} />
              </button>
              {unread > 0 && (
                <button style={BS.headBtn} onClick={markAllRead} title="Mark all read">
                  <CheckCheck size={12} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={BS.list}>
            {notifs.length === 0 ? (
              <div style={BS.empty}>
                <Bell size={28} color="var(--border)" />
                <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 10 }}>No notifications yet</p>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n._id}
                  style={{ ...BS.item, ...(n.read ? {} : BS.itemUnread), cursor: n.eventId ? 'pointer' : 'default' }}
                  onClick={async () => {
                    if (!n.read) await markOneRead(n._id);
                    if (n.eventId) {
                      setOpen(false);
                      const hash = n.type === 'comment' ? '#comments' : '';
                      navigate(`/events/${n.eventId}${hash}`);
                    }
                  }}
                >
                  <span style={BS.itemIcon}>{typeIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {n.eventTitle && (
                      <div style={BS.eventLabel}>{n.eventTitle}</div>
                    )}
                    <p style={BS.itemMsg}>{n.message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={BS.itemTime}>{timeAgo(n.createdAt)}</span>
                      {n.eventId && (
                        <span style={BS.viewLink}>
                          {n.type === 'comment' ? 'View comments →' : 'View event →'}
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.read && <div style={BS.dot} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Bell styles ─── */
const BS = {
  iconBtn: {
    position: 'relative', background: "var(--bg-hover)",
    border: '1px solid var(--border)', color: "var(--text2)",
    borderRadius: 10, width: 38, height: 38,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s', cursor: 'pointer',
  },
  badge: {
    position: 'absolute', top: -5, right: -5,
    background: 'linear-gradient(135deg,var(--red),#ef4444)',
    color: '#fff', fontSize: 9, fontWeight: 800,
    borderRadius: 99, minWidth: 16, height: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 3px', border: '2px solid var(--bg)',
    boxShadow: '0 0 8px rgba(248,113,113,0.5)',
  },
  panel: {
    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
    width: 340, background: "var(--bg2)",
    border: '1px solid var(--border)', borderRadius: 16,
    boxShadow: '0 16px 60px rgba(0,0,0,0.7)',
    zIndex: 500, overflow: 'hidden',
    animation: 'fadeUp 0.2s ease',
  },
  panelHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderBottom: '1px solid var(--bg3)',
  },
  panelTitle: { fontSize: 14, fontWeight: 700, color: "var(--text)" },
  unreadBadge: {
    fontSize: 10, fontWeight: 700,
    background: 'rgba(91,141,238,0.15)', color: "var(--blue)",
    border: '1px solid var(--blue-border)',
    borderRadius: 99, padding: '1px 7px',
  },
  headBtn: {
    background: "var(--bg-hover)", border: '1px solid var(--border)',
    color: "var(--muted)", borderRadius: 7, width: 26, height: 26,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  list: { maxHeight: 360, overflowY: 'auto' },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '40px 20px',
  },
  item: {
    display: 'flex', gap: 10, padding: '12px 16px',
    borderBottom: '1px solid #0d0f15', cursor: 'pointer',
    transition: 'background 0.15s', alignItems: 'flex-start',
  },
  itemUnread: { background: 'rgba(91,141,238,0.04)' },
  itemIcon: { fontSize: 18, flexShrink: 0, marginTop: 1 },
  eventLabel: {
    fontSize: 10, fontWeight: 700, color: "var(--blue)",
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3,
  },
  itemMsg: { fontSize: 13, color: '#b0b8cc', lineHeight: 1.5, margin: 0 },
  itemTime: { fontSize: 11, color: "var(--faint)" },
  viewLink: { fontSize: 11, color: "var(--blue)", fontWeight: 600 },
  dot: {
    width: 7, height: 7, borderRadius: '50%',
    background: "var(--blue)", flexShrink: 0, marginTop: 6,
    boxShadow: '0 0 6px rgba(91,141,238,0.6)',
  },
};

/* ─── Navbar ─── */
export default function Navbar({ title }) {
  const { user, token, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate  = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleConfig = {
    student:   { label: 'Student',   color: "var(--green)", bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)' },
    organizer: { label: 'Organizer', color: "var(--purple)", bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
    club:      { label: 'Club',      color: "var(--purple)", bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
    faculty:   { label: 'Faculty',   color: "var(--accent)", bg: 'rgba(232,201,122,0.1)', border: 'rgba(232,201,122,0.25)' },
    admin:     { label: 'Admin',     color: "var(--pink)", bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.25)' },
  };
  const rc = roleConfig[user?.role] || roleConfig.student;

  return (
    <nav style={{
      ...S.nav,
      background: scrolled ? "var(--nav-bg-scrolled)" : "var(--nav-bg-idle)",
      borderBottomColor: scrolled ? "var(--nav-border-scrolled)" : "var(--nav-border-idle)",
      boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none',
    }}>
      {/* ── Brand ── */}
      <div style={S.left} onClick={() => navigate(user?.role === 'student' ? '/feed' : '/dashboard')}
        role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/feed')}>
        <div style={S.logoWrap}>
          <div style={S.logo}>
            <Zap size={16} fill="#0b0c0e" color="#0b0c0e" />
          </div>
          <div style={S.logoPulse} />
        </div>
        <div style={S.brandBlock}>
          <span style={S.brand}>CampusSync</span>
          {title && <span style={S.page}>{title}</span>}
        </div>
      </div>

      {/* ── Right ── */}
      <div style={S.right}>
        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Theme" style={{ border: 'none', background: 'transparent' }}>
          <div className="icon-wrap" key={isDark ? 'dark' : 'light'} style={{ display: 'flex' }}>
            {isDark ? <Sun size={18} color="var(--muted)" /> : <Moon size={18} color="var(--text2)" />}
          </div>
        </button>

        {/* Live notification bell */}
        <NotificationBell token={token} />

        {/* User chip — click to go to profile */}
        <div style={{ ...S.userChip, cursor: 'pointer' }} onClick={() => navigate('/profile')} title="View Profile">
          <div style={{...S.avatar, overflow: 'hidden', padding: 0}}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div style={S.userInfo}>
            <span style={S.userName}>{user?.name?.split(' ')[0]}</span>
            <span style={{ ...S.roleTag, color: rc.color, background: rc.bg, border: `1px solid ${rc.border}` }}>
              {rc.label}
            </span>
          </div>
        </div>

        <div style={S.divider} />

        {/* Logout */}
        <button onClick={handleLogout} style={S.logoutBtn} aria-label="Logout">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

const S = {
  nav: {
    height: 64,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px',
    position: 'sticky', top: 0, zIndex: 200,
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--nav-border-idle)',
    transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
  },
  left: {
    display: 'flex', alignItems: 'center', gap: 12,
    cursor: 'pointer', userSelect: 'none',
  },
  logoWrap: { position: 'relative', flexShrink: 0 },
  logo: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg, var(--blue), var(--purple))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 16px rgba(91,141,238,0.4)',
    position: 'relative', zIndex: 1,
  },
  logoPulse: {
    position: 'absolute', inset: -3, borderRadius: 13,
    background: 'linear-gradient(135deg, var(--blue), var(--purple))',
    opacity: 0.15, animation: 'pulse-ring 2s ease-out infinite',
  },
  brandBlock: { display: 'flex', alignItems: 'baseline', gap: 8 },
  brand: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20, color: "var(--text)", letterSpacing: '-0.3px',
  },
  page: {
    fontSize: 13, color: "var(--muted)",
    borderLeft: '1px solid var(--border)', paddingLeft: 10, marginLeft: 2,
  },

  right: { display: 'flex', alignItems: 'center', gap: 8 },

  userChip: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: "var(--bg-hover)", border: '1px solid var(--border)',
    borderRadius: 12, padding: '6px 12px 6px 8px',
  },
  avatar: {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    background: 'linear-gradient(135deg,var(--blue),var(--purple))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, color: '#fff',
  },
  userInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  userName: { fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1 },
  roleTag: {
    fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },

  divider: { width: 1, height: 28, background: "var(--border)", margin: '0 4px' },

  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
    color: "var(--red)", borderRadius: 10, padding: '7px 14px',
    fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
  },
};