import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Ticket, Calendar, MapPin, Clock, XCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyRSVPs() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRSVPs = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/rsvp/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort upcoming first
      const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(sorted);
    } catch {
      toast.error('Failed to load RSVPs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRSVPs();
  }, [token]);

  const handleCancel = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to cancel your RSVP for ${eventTitle}?`)) return;
    
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/rsvp/${eventId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Cancelled RSVP for ${eventTitle}`);
      setEvents(events.filter(e => e._id !== eventId));
    } catch {
      toast.error('Failed to cancel RSVP');
    }
  };

  const getStatus = (date) => {
    const now = new Date();
    const eventDate = new Date(date);
    if (eventDate < now) return 'past';
    const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 'soon';
    return 'upcoming';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar title="My RSVPs" />
      <div style={S.container}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}><Ticket size={28} style={{ color: 'var(--purple)' }} /> Registered Events</h1>
            <p style={S.subtitle}>Manage your upcoming event tickets.</p>
          </div>
          <div style={S.stats}>
            <div style={S.statBox}>
              <span style={S.statVal}>{events.filter(e => new Date(e.date) >= new Date()).length}</span>
              <span style={S.statLabel}>Upcoming</span>
            </div>
            <div style={S.statBox}>
              <span style={{...S.statVal, color: 'var(--muted)'}}>{events.filter(e => new Date(e.date) < new Date()).length}</span>
              <span style={S.statLabel}>Past Attended</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading tickets...</div>
        ) : events.length === 0 ? (
          <div style={S.emptyState}>
            <Calendar size={48} style={{ color: 'var(--border)', marginBottom: 16 }} />
            <p style={S.emptyTitle}>No RSVPs yet</p>
            <p style={S.emptySub}>You haven't registered for any events. <Link to="/" style={{color: 'var(--blue)'}}>Explore events</Link></p>
          </div>
        ) : (
          <div style={S.timeline}>
            <AnimatePresence>
              {events.map((event, i) => {
                const status = getStatus(event.date);
                return (
                  <motion.div 
                    key={event._id} 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                    style={{...S.ticketCard, opacity: status === 'past' ? 0.7 : 1}}
                  >
                    <div style={S.dateBadge}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase' }}>
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>
                        {new Date(event.date).getDate()}
                      </span>
                    </div>

                    <div style={S.ticketBody}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <h3 style={S.evtTitle}>{event.title}</h3>
                        {status === 'soon' && <span style={{...S.badge, background: 'var(--purple)20', color: 'var(--purple)'}}>Closing Soon</span>}
                        {status === 'past' && <span style={{...S.badge, background: 'var(--bg3)', color: 'var(--muted)'}}>Past</span>}
                      </div>

                      <div style={S.infoGroup}>
                        <Clock size={14} /> <span>{event.time}</span>
                        <MapPin size={14} style={{ marginLeft: 8 }} /> <span>{event.location}</span>
                      </div>

                      <p style={S.evtDesc}>{event.description?.substring(0, 100)}...</p>

                      <div style={S.actions}>
                        <Link to={`/events/${event._id}`} style={S.viewBtn}>
                          <ExternalLink size={14} /> View Details
                        </Link>
                        {status !== 'past' && (
                          <button onClick={() => handleCancel(event._id, event.title)} style={S.cancelBtn} title="Cancel RSVP">
                            <XCircle size={14} /> Cancel Ticket
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  container: { maxWidth: 800, margin: '0 auto', padding: '60px 24px', overflowX: 'hidden' }, // Added overflow-x hidden
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 24 },
  title: { fontSize: 32, fontFamily: "'DM Serif Display', serif", color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'var(--muted)' },
  stats: { display: 'flex', gap: 16 },
  statBox: { background: 'var(--bg2)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 },
  statVal: { fontSize: 24, fontWeight: 800, color: 'var(--text)' },
  statLabel: { fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  
  timeline: { display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: '100%' }, // Added max width 100%
  ticketCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', overflow: 'hidden', transition: '0.2s', width: '100%' }, // Fix width
  dateBadge: { width: 90, background: 'var(--bg)', borderRight: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', flexShrink: 0 }, // flexshrink 0
  ticketBody: { padding: 24, flex: 1, minWidth: 0, boxSizing: 'border-box' }, // Box sizing & minwidth
  evtTitle: { fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}, // ellipsis text overflow
  badge: { padding: '4px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  infoGroup: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12, flexWrap: 'wrap' },
  evtDesc: { fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 20 },
  actions: { display: 'flex', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16, flexWrap: 'wrap' },
  viewBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--blue)', fontSize: 14, fontWeight: 600, textDecoration: 'none' },
  cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--red)', background: 'none', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  
  emptyState: { textAlign: 'center', padding: '80px 24px', background: 'var(--bg2)', borderRadius: 16, border: '1px dashed var(--border)' },
  emptyTitle: { fontSize: 20, color: 'var(--text)', fontWeight: 600, marginBottom: 8 },
  emptySub: { fontSize: 15, color: 'var(--muted)' }
};