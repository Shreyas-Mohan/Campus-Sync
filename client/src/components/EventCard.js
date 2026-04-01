import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Users, CheckCircle2, Edit2, Trash2, Eye, Building, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function EventCard({
  event,
  initialRsvpd = false,
  onRsvpToggle,
  showApprove,
  onApprove,
  showActions,
  onEdit,
  onDelete,
}) {
  const { token } = useAuth();
  const navigate  = useNavigate();
  const [rsvpd,   setRsvpd]   = useState(initialRsvpd);
  const [count,   setCount]   = useState(event.rsvpCount || 0);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleRsvp = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/rsvp/${event._id}`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRsvpd(data.rsvpd);
      setCount(c => data.rsvpd ? c + 1 : c - 1);
      toast.success(data.rsvpd ? 'RSVP confirmed! 🎉' : 'RSVP cancelled');
      if (onRsvpToggle) onRsvpToggle(event._id, data.rsvpd);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleApproveStatus = async (status) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/events/${event._id}/status`, { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Event ${status}`);
      if (onApprove) onApprove();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${event._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Event deleted');
      if (onDelete) onDelete(event._id);
    } catch (err) { toast.error(err.response?.data?.msg || 'Delete failed'); }
  };

  const statusCfg = {
    approved: { color: "var(--green)", bg: 'rgba(var(--green-rgb),0.08)', dot: "var(--green)", label: 'Live' },
    pending:  { color: "var(--accent)", bg: 'rgba(var(--accent-rgb),0.08)', dot: "var(--accent)", label: 'Pending' },
    rejected: { color: "var(--red)", bg: 'rgba(var(--red-rgb),0.08)', dot: "var(--red)", label: 'Rejected' },
  };
  const sc = statusCfg[event.status] || statusCfg.pending;

  const catCfg = {
    Tech:     { color: "var(--blue)", icon: '💻' },
    Music:    { color: "var(--purple)", icon: '🎵' },
    Sports:   { color: "var(--green)", icon: '⚽' },
    Culture:  { color: "var(--orange)", icon: '🎭' },
    Business: { color: '#60a5fa', icon: '💼' },
    Art:      { color: "var(--pink)", icon: '🎨' },
    Science:  { color: "var(--teal)", icon: '🔬' },
    Social:   { color: '#fbbf24', icon: '🎉' },
  };
  const cc = catCfg[event.category] || { color: "var(--blue)", icon: '📅' };

  const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const formattedTime = new Date(event.date).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  const isPastEvent = new Date(event.date) < new Date();
  const isSoldOut = event.maxCapacity && (count >= event.maxCapacity);

  return (
    <div
      style={{
        ...S.card,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${cc.color}22`
          : '0 4px 20px rgba(0,0,0,0.3)',
        borderColor: hovered ? cc.color + '33' : "var(--border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster strip or gradient header */}
      <div style={{ ...S.headerStrip, background: `linear-gradient(135deg, ${cc.color}22, ${cc.color}08)` }}>
        {event.poster
          ? <img src={event.poster} alt="" style={S.posterThumb} />
          : <div style={{ ...S.posterFallback, color: cc.color + '66' }}>{cc.icon}</div>
        }
        {/* Status badge */}
        <span style={{ ...S.statusBadge, color: sc.color, background: sc.bg, border: `1px solid ${sc.color}33` }}>
          <span style={{ ...S.statusDot, background: sc.dot }} />{sc.label}
        </span>
      </div>

      {/* Body */}
      <div style={S.body}>
        
        {/* Reapproval Banner for Faculty/Admins */}
        {showApprove && event.isReapprovalRequest && (
          <div style={{ background: 'rgba(232,201,122,0.1)', border: '1px solid rgba(232,201,122,0.3)', borderRadius: 6, padding: '8px 10px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>⚠️ Edit Re-Approval Request</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.4 }}>
               <strong style={{ color: 'var(--text)' }}>Note:</strong> {event.reapprovalNote || 'No explanation provided.'}
            </div>
          </div>
        )}

        {/* Category pill */}
        <span style={{ ...S.catPill, color: cc.color, background: cc.color + '14', border: `1px solid ${cc.color}33` }}>
          {cc.icon} {event.category || 'Event'}
        </span>

        {/* Title */}
        <h3 style={S.title}>{event.title}</h3>

        {/* Short desc */}
        {event.description && <p style={S.desc}>{event.description}</p>}

        {/* Meta */}
        <div style={S.meta}>
          <div style={S.metaItem}>
            <Calendar size={13} color={cc.color} />
            <span>{formattedDate}</span>
          </div>
          <div style={S.metaItem}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>⏰</span>
            <span>{formattedTime}</span>
          </div>
          <div style={S.metaItem}>
            <MapPin size={13} color="var(--pink)" />
            <span>{event.venue}</span>
          </div>
          <div style={S.metaItem}>
            <Users size={13} color="var(--green)" />
            <span>{count} going</span>
          </div>
        </div>

        {/* Organized By */}
        {(event.club || event.organizerName) && (
          <div style={S.organizerRow}>
            {event.club ? <Building size={12} color="var(--primary)" /> : <User size={12} color="var(--accent)" />}
            <span style={S.organizerLabel}>Organized by</span>
            <span style={S.organizerValue}>
              {event.club ? event.club.name : event.organizerName}
            </span>
          </div>
        )}

        {/* Tags */}
        {event.tags?.length > 0 && (
          <div style={S.tags}>
            {event.tags.slice(0, 3).map(t => (
              <span key={t} style={S.tag}>{t}</span>
            ))}
            {event.tags.length > 3 && (
              <span style={S.tag}>+{event.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Divider */}
        <div style={S.divider} />

        {/* Actions */}
        <div style={S.actions}>
          {/* View Details — always visible */}
          <button
            onClick={() => navigate(`/events/${event._id}`)}
            style={{ ...S.detailsBtn, borderColor: hovered ? cc.color + '44' : "var(--border)" }}
          >
            <Eye size={13} />
            <span>View Details</span>
          </button>

          {/* RSVP */}
          {!showApprove && !showActions && event.status === 'approved' && isPastEvent && (
            <button disabled style={{ ...S.rsvpBtn, background: 'var(--bg3)', color: 'var(--muted)', cursor: 'not-allowed' }}>
              Event Ended
            </button>
          )}
          {!showApprove && !showActions && event.status === 'approved' && !isPastEvent && isSoldOut && !rsvpd && (
            <button disabled style={{ ...S.rsvpBtn, background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)', cursor: 'not-allowed' }}>
              Sold Out
            </button>
          )}
          {!showApprove && !showActions && event.status === 'approved' && !isPastEvent && (!isSoldOut || rsvpd) && (
            <button
              onClick={handleRsvp}
              disabled={loading}
              style={{
                ...S.rsvpBtn,
                ...(rsvpd ? S.rsvpDone : { background: `linear-gradient(135deg, ${cc.color}, ${cc.color}bb)` }),
              }}
            >
              {loading ? <span style={S.spinnerInline} /> :
                rsvpd
                  ? <><CheckCircle2 size={14} />Going</>
                  : <>✦ RSVP</>
              }
            </button>
          )}

          {/* Approve / Reject */}
          {showApprove && event.status === 'pending' && (
            <div style={S.btnRow}>
              <button onClick={() => handleApproveStatus('approved')} style={S.approveBtn}>✓ Approve</button>
              <button onClick={() => handleApproveStatus('rejected')} style={S.rejectBtn}>✗ Reject</button>
            </div>
          )}

          {/* Organizer edit/delete */}
          {showActions && (
            <div style={S.btnRow}>
              <button onClick={() => onEdit(event)} style={S.editBtn}>
                <Edit2 size={12} /> Edit
              </button>
              <button onClick={handleDelete} style={S.deleteBtn}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  card: {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    transition: 'all 0.25s ease',
    cursor: 'default',
  },

  // Header strip
  headerStrip: {
    height: 120, position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  posterThumb: {
    width: '100%', height: '100%', objectFit: 'cover',
    position: 'absolute', inset: 0,
  },
  posterFallback: {
    fontSize: 52, userSelect: 'none',
  },
  statusBadge: {
    position: 'absolute', top: 10, right: 10,
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 600, padding: '4px 10px',
    borderRadius: 99, backdropFilter: 'blur(8px)',
  },
  statusDot: { width: 6, height: 6, borderRadius: '50%' },

  body: { padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 },

  catPill: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 600, padding: '4px 10px',
    borderRadius: 99, alignSelf: 'flex-start',
  },

  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 18, color: "var(--text)", lineHeight: 1.3,
    wordBreak: 'break-word',
  },
  desc: {
    fontSize: 13, color: "var(--muted)", lineHeight: 1.6,
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },

  meta: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' },
  metaItem: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, color: "var(--text2)",
    overflow: 'hidden',
  },

  organizerRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, padding: '4px 8px', marginTop: 2,
    background: 'var(--blue-dim)', border: '1px solid var(--blue-border)', 
    borderRadius: 8, width: 'fit-content',
  },
  organizerLabel: { color: 'var(--muted)' },
  organizerValue: { color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' },

  tags: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  tag: {
    fontSize: 11, background: "var(--bg4)", border: "1px solid var(--border)",
    padding: '2px 8px', borderRadius: 99, color: "var(--muted)",
  },

  divider: { height: 1, background: "var(--bg3)", margin: '2px 0' },

  actions: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 },
  btnRow:  { display: 'flex', gap: 8 },

  detailsBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    background: 'rgba(var(--bg-input-rgb),0.8)', border: "1px solid var(--border)",
    color: "var(--text2)", borderRadius: 10, padding: '9px 14px',
    fontSize: 13, fontWeight: 500, transition: 'all 0.2s', width: '100%',
  },

  rsvpBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    border: 'none', borderRadius: 10, padding: '10px',
    fontSize: 13, fontWeight: 700, color: "var(--text)",
    transition: 'all 0.2s', width: '100%',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  },
  rsvpDone: {
    background: 'rgba(var(--green-rgb),0.1)',
    border: '1px solid rgba(var(--green-rgb),0.3)',
    color: "var(--green)",
  },
  spinnerInline: {
    width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)',
    borderTopcolor: "var(--text)", borderRadius: '50%',
    animation: 'spin 0.6s linear infinite', display: 'block',
  },

  approveBtn: {
    flex: 1, background: 'rgba(var(--green-rgb),0.08)', border: '1px solid rgba(var(--green-rgb),0.25)',
    color: "var(--green)", borderRadius: 10, padding: '9px 8px', fontSize: 13, fontWeight: 600,
    transition: 'all 0.2s',
  },
  rejectBtn: {
    flex: 1, background: 'rgba(var(--red-rgb),0.08)', border: '1px solid rgba(var(--red-rgb),0.25)',
    color: "var(--red)", borderRadius: 10, padding: '9px 8px', fontSize: 13, fontWeight: 600,
    transition: 'all 0.2s',
  },
  editBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    background: 'rgba(var(--blue-rgb),0.08)', border: '1px solid rgba(var(--blue-rgb),0.25)',
    color: "var(--blue)", borderRadius: 10, padding: '9px', fontSize: 13, fontWeight: 500,
  },
  deleteBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    background: 'rgba(var(--red-rgb),0.08)', border: '1px solid rgba(var(--red-rgb),0.25)',
    color: "var(--red)", borderRadius: 10, padding: '9px', fontSize: 13, fontWeight: 500,
  },
};