import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
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
  onViewAttendees,
}) {
  const { token } = useAuth();
  const navigate  = useNavigate();
  const [rsvpd,   setRsvpd]   = useState(initialRsvpd);
  const [count,   setCount]   = useState(event.rsvpCount || 0);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [facultyModal, setFacultyModal] = useState({ open: false, status: '' });
  const [facultyNote, setFacultyNote] = useState('');

  const handleRsvp = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/rsvp/${event._id}`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRsvpd(data.rsvpd);
      setCount(c => data.rsvpd ? c + 1 : c - 1);
      toast.success(data.rsvpd ? 'RSVP confirmed! 🎉' : 'RSVP cancelled');
      if (onRsvpToggle) onRsvpToggle(event._id, data.rsvpd);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleApproveStatus = async (status, note) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/events/${event._id}/status`, { status, facultyNote: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Event ${status}`);
      if (onApprove) onApprove();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/events/${event._id}`,
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
    past:     { color: "var(--muted)", bg: 'rgba(150,150,150,0.08)', dot: "var(--muted)", label: 'Ended' },
  };

  const isPastEvent = new Date(event.date) < new Date();
  
  let sc = statusCfg[event.status] || statusCfg.pending;
  if (event.status === 'approved' && isPastEvent) {
    sc = statusCfg.past;
  }

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

  const isSoldOut = event.maxCapacity && (count >= event.maxCapacity);

  return (
    <motion.div
      layout
      style={{
        ...S.card,
        boxShadow: hovered
          ? `0 20px 60px rgba(138,43,226,0.15), 0 0 0 1px ${cc.color}22`
          : '0 4px 20px rgba(0,0,0,0.3)',
        borderColor: hovered ? 'rgba(138,43,226,0.3)' : "var(--border)",
      }}
      whileHover={{ y: -4 }}
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

        {/* Faculty Note Display for Organizers */}
        {showActions && event.facultyNote && (
          <div style={{ background: event.status === 'rejected' ? 'rgba(var(--red-rgb),0.1)' : 'rgba(var(--green-rgb),0.1)', border: `1px solid ${event.status === 'rejected' ? 'var(--red)' : 'var(--green)'}33`, borderRadius: 6, padding: '8px 10px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: event.status === 'rejected' ? 'var(--red)' : 'var(--green)', textTransform: 'uppercase', marginBottom: 4 }}>
              Faculty Comment ({event.status}):
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.4 }}>
               {event.facultyNote}
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
              <button onClick={() => setFacultyModal({ open: true, status: 'approved' })} style={S.approveBtn}>✓ Approve</button>
              <button onClick={() => setFacultyModal({ open: true, status: 'rejected' })} style={S.rejectBtn}>✗ Reject</button>
            </div>
          )}

          {/* Organizer edit/delete (hidden if past event) */}
          {showActions && !isPastEvent && (
            <div style={S.btnRow}>
              <button onClick={() => onEdit(event)} style={S.editBtn}>
                <Edit2 size={12} /> Edit
              </button>
              <button onClick={handleDelete} style={S.deleteBtn}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          {showActions && (
            <button onClick={(e) => { e.stopPropagation(); if (onViewAttendees) onViewAttendees(); }} style={S.editBtn}>
              <Users size={12} /> View RSVPs
            </button>
          )}
        </div>
      </div>

      {/* Sleek Faculty Approval Modal */}
      {facultyModal.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setFacultyModal({ open: false, status: '' }); setFacultyNote(''); }}>
          <div style={{ background: 'var(--bg)', padding: 24, borderRadius: 16, width: '90%', maxWidth: 400, border: `1px solid var(--${facultyModal.status === 'rejected' ? 'red' : 'green'})` }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, color: "var(--text)", marginBottom: 8, fontFamily: "'DM Serif Display', serif" }}>
              {facultyModal.status === 'approved' ? 'Approve Event' : 'Reject Event'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.4 }}>
              Optional: Leave a reason or feedback for the organizers.
            </p>
            <textarea 
              value={facultyNote}
              onChange={e => setFacultyNote(e.target.value)}
              placeholder="e.g., Looks great! / Poster missing..."
              style={{ width: '100%', padding: '12px', borderRadius: 8, background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', minHeight: 90, marginBottom: 16, resize: 'vertical', fontSize: 14, outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => { setFacultyModal({ open: false, status: '' }); setFacultyNote(''); }} 
                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleApproveStatus(facultyModal.status, facultyNote);
                  setFacultyModal({ open: false, status: '' });
                  setFacultyNote('');
                }} 
                style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: `var(--${facultyModal.status === 'rejected' ? 'red' : 'green'})`, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Confirm {facultyModal.status === 'approved' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

const S = {
  card: {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.3s ease",
    cursor: "pointer",
    position: "relative",
    height: "100%",
    boxShadow: "0 4px 15px rgba(138,43,226,0.05)",
  },
  cardHover: {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 30px rgba(138,43,226,0.15)",
    borderColor: "rgba(138,43,226,0.3)",
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