import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, X, CheckCircle, Clock, Upload, Link as LinkIcon, FileText, User, Activity, BarChart2, Zap, Compass, ChevronRight, PenTool, Search } from 'lucide-react';

const CATS = ['Tech','Music','Sports','Culture','Business','Art','Science','Social'];

const BLANK = {
  title: '', description: '', detailedDescription: '', category: 'Tech',
  date: '', venue: '', tags: '', maxCapacity: '',
  poster: '', applicationLink: '',
  eventHead1: { name: '', rollNo: '', contact: '' },
  eventHead2: { name: '', rollNo: '', contact: '' },
  needsReapproval: false, reapprovalNote: ''
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });

export default function OrganizerDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [events,        setEvents]        = useState([]);
  const [tab,           setTab]           = useState('all');
  const [submitting,    setSubmitting]    = useState(false);

  const isFaculty   = user?.role === 'faculty';
  const isOrganizer = user?.role === 'organizer' || user?.role === 'club';
  const isAdmin     = user?.role === 'admin';
  const isClub      = user?.role === 'club';

  const fetchEvents = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(data);
    } catch {}
  };

  useEffect(() => { 
    fetchEvents(); 
  }, [isClub]);

  const openCreate = () => {
    navigate('/create-event');
  };

  const openEdit = (event) => {
    navigate('/create-event', { state: { editData: event } });
  };

  const handleDelete = (id) => setEvents(prev => prev.filter(e => e._id !== id));

  const myEvents = isOrganizer
    ? events.filter(e => e.organizer === user.id || e.organizerName === user.name || e.club === user.id || e?.club?._id === user.id)
    : events;

  const isPastEvent = (d) => new Date(d) < new Date();

  // Active events for the 'all' tab (handles faculty/club view rules)
  const activeEvents = myEvents.filter(e => !isPastEvent(e.date));

  const filtered =
    tab === 'pending'  ? activeEvents.filter(e => e.status === 'pending')  :
    tab === 'approved' ? activeEvents.filter(e => e.status === 'approved') :
    tab === 'rejected' ? activeEvents.filter(e => e.status === 'rejected') :
    tab === 'past'     ? myEvents.filter(e => isPastEvent(e.date)) :
    activeEvents;

  const stats = {
    totalActive:  activeEvents.length,
    approved:     activeEvents.filter(e => e.status === 'approved').length,
    pending:      activeEvents.filter(e => e.status === 'pending').length,
    rejected:     activeEvents.filter(e => e.status === 'rejected').length,
    past:         myEvents.filter(e => isPastEvent(e.date)).length,
    totalRsvp:    activeEvents.reduce((s, e) => s + (e.rsvpCount || 0), 0),
  };

  const STAT_CARDS = isFaculty
    ? [
        { label: 'Pending Review', value: stats.pending,  color: "var(--accent)", bg: 'rgba(232,201,122,0.08)', border: 'rgba(232,201,122,0.2)', Icon: Clock },
        { label: 'Approved',       value: stats.approved, color: "var(--green)", bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)', Icon: CheckCircle },
      ]
    : isAdmin
    ? [
        { label: 'Active Events',  value: stats.totalActive, color: "var(--blue)", bg: "var(--blue-dim)",   border: 'rgba(91,141,238,0.2)',   Icon: Activity },
        { label: 'Approved',       value: stats.approved,    color: "var(--green)", bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.2)',   Icon: CheckCircle },
        { label: 'Pending',        value: stats.pending,     color: "var(--accent)", bg: 'rgba(232,201,122,0.08)', border: 'rgba(232,201,122,0.2)',  Icon: Clock },
      ]
    : [
        { label: 'Active Events',  value: stats.totalActive, color: "var(--blue)", bg: "var(--blue-dim)",   border: 'rgba(91,141,238,0.2)',   Icon: Activity },
        { label: 'Approved',       value: stats.approved,    color: "var(--green)", bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.2)',   Icon: CheckCircle },
        { label: 'Pending',        value: stats.pending,     color: "var(--accent)", bg: 'rgba(232,201,122,0.08)', border: 'rgba(232,201,122,0.2)',  Icon: Clock }
      ];

  return (
    <div style={{ minHeight: '100vh', background: "var(--bg)" }}>
      <Navbar title={isFaculty ? 'Faculty Panel' : isAdmin ? 'Admin Panel' : 'Dashboard'} />

      {/* ── Dashboard Hero ── */}
      <div style={S.dashHero}>
        <div style={S.heroGlow} />
        <div style={S.heroContent}>
          <div style={S.roleChip}>
            <Zap size={11} />
            {isFaculty ? 'Faculty Panel' : isAdmin ? 'Admin' : 'Organizer Dashboard'}
          </div>
          <h1 style={S.heading}>
            {isFaculty ? 'Event Approvals' : (
              <>Hello, <span style={{ color: 'var(--blue)' }}>
                {(() => {
                  if (!user?.name) return 'User';
                  const parts = user.name.trim().split(/\s+/);
                  const first = parts[0];
                  const titles = ['dr.', 'mr.', 'ms.', 'mrs.', 'prof.', 'sir'];
                  if (titles.includes(first.toLowerCase()) && parts.length > 1) {
                    return `${first} ${parts[1]}`;
                  }
                  return first;
                })()}
              </span></>
            )}
          </h1>
          <p style={S.sub}>
            {isFaculty
              ? 'Review pending submissions and manage campus events'
              : 'Manage your events, track RSVPs, and reach your audience'}
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, position: 'relative', zIndex: 1, alignItems: 'center' }}>
          <Link to="/club" style={{ textDecoration: 'none' }}>
            <div style={S.exploreBtn}>
              <Compass size={18} /> Explore clubs of IIITM <ChevronRight size={18} />
            </div>
          </Link>
          {isOrganizer && (
            <>
              {isClub && (
                <button onClick={() => navigate('/manage-club')} style={{...S.createBtn, background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)'}}>
                  <User size={16} /> Edit Profile
                </button>
              )}
              <button onClick={openCreate} style={S.createBtn}>
                <PlusCircle size={16} /> Create Event
              </button>
            </>
          )}
        </div>
      </div>

      <div style={S.container}>
        {/* ── Context Header ── */}
        <div style={S.contextHeader}>
          <h2 style={S.listTitle}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Events 
            <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 400, marginLeft: 10 }}>
              {filtered.length} total
            </span>
          </h2>
        </div>

        {/* ── Tabs with Integrated Badges ── */}
        <div style={S.tabs}>
          {[
            ['all', 'Active Events', stats.totalActive],
            ['pending', 'Pending', stats.pending],
            ['approved', 'Approved', stats.approved],
            ['rejected', 'Rejected', stats.rejected],
            ['past', 'Past Events', stats.past]
          ].map(([val, lbl, count]) => (
            <button key={val} onClick={() => setTab(val)}
              style={{ ...S.tabBtn, ...(tab === val ? S.tabBtnOn : {}), display: 'flex', alignItems: 'center', gap: 8 }}>
              {lbl}
              <span style={{ 
                fontSize: 10, 
                background: tab === val ? 'var(--blue)' : 'var(--bg3)', 
                color: tab === val ? '#fff' : 'var(--muted)',
                padding: '1px 6px', 
                borderRadius: 6,
                fontWeight: 700 
              }}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Event Grid ── */}
        {filtered.length === 0 ? (
          <div style={S.emptyState}>
            <p style={{ fontSize: 44, marginBottom: 12 }}>📭</p>
            <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>No events here</p>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              {isOrganizer ? "Click 'Create Event' to get started" : "No events in this category"}
            </p>
          </div>
        ) : (
          <div style={S.grid}>
            {filtered.map(e => (
              <EventCard key={e._id} event={e}
                showApprove={isFaculty || isAdmin}
                onApprove={fetchEvents}
                showActions={isOrganizer}
                onEdit={openEdit}
                onDelete={handleDelete}
                onViewAttendees={() => navigate(`/attendees/${e._id}`)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

const S = {
  dashHero: {
    position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(180deg, #0d1020 0%, var(--bg) 100%)',
    borderBottom: '1px solid var(--bg3)',
    padding: '40px 32px',
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20,
  },
  heroGlow: {
    position: 'absolute', top: '-50%', left: '-5%', width: 600, height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, var(--blue-dim) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  heroContent: { position: 'relative', zIndex: 1 },
  roleChip: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: "var(--blue-dim)", border: '1px solid var(--blue-border)',
    color: "var(--blue)", borderRadius: 99, padding: '4px 12px',
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 10,
  },
  heading: { fontFamily: "'DM Serif Display', serif", fontSize: 34, color: "var(--text)", marginBottom: 6 },
  sub:     { color: "var(--muted)", fontSize: 14 },  exploreBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', 
    background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.3)',
    padding: '0.6rem 1.2rem', borderRadius: '20px', color: 'var(--purple)', 
    fontWeight: 600, transition: '0.2s', cursor: 'pointer', whiteSpace: 'nowrap'
  },  createBtn: {
    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
    background: 'linear-gradient(135deg,var(--blue),var(--blue2))',
    color: '#fff', border: 'none', borderRadius: 12,
    padding: '12px 22px', fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 20px rgba(91,141,238,0.4)',
    transition: 'all 0.2s', position: 'relative', zIndex: 1,
  },

  container: { maxWidth: 1200, margin: '0 auto', padding: '32px 28px 64px' },

  contextHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 4px',
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: "'DM Serif Display', serif",
    color: 'var(--text)',
  },

  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 14, marginBottom: 28,
  },
  statCard: {
    border: '1px solid', borderRadius: 14,
    padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 6,
  },
  statIconWrap: { marginBottom: 4 },
  statNum:   { fontFamily: "'DM Serif Display', serif", fontSize: 34, lineHeight: 1 },
  statLabel: { fontSize: 13, color: "var(--muted)" },

  tabs: { display: 'flex', gap: 6, marginBottom: 22 },
  tabBtn: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '9px 20px', borderRadius: 10, border: '1.5px solid var(--border)',
    background: "var(--glass-bg)", color: "var(--text2)",
    fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
  },
  tabBtnOn: {
    background: "var(--blue-dim)", border: '1.5px solid var(--blue-border)', color: "var(--blue)",
  },
  pendingBadge: {
    background: "var(--accent)", color: '#0b0c0e', borderRadius: 99,
    fontSize: 10, fontWeight: 800, padding: '1px 6px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 },
  emptyState: {
    textAlign: 'center', padding: '80px 24px',
    background: "var(--bg2)", border: '1px dashed var(--border)', borderRadius: 16,
  },

  // ────────── MODAL ──────────
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
    backdropFilter: 'blur(8px)',
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: "var(--bg2)", border: '1px solid var(--border)', borderRadius: 20,
    padding: '28px 28px 32px',
    width: '100%', maxWidth: 580,
    maxHeight: '92vh', overflowY: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
    animation: 'fadeUp 0.3s ease',
  },
  modalHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: { fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "var(--text)", marginBottom: 4 },
  modalSub:   { color: "var(--muted)", fontSize: 13 },
  closeBtn: {
    background: 'rgba(37,40,54,0.6)', border: '1px solid var(--border)',
    color: "var(--text2)", borderRadius: 10, padding: '8px',
    display: 'flex', alignItems: 'center', transition: 'all 0.2s',
  },
  editBanner: {
    background: 'rgba(232,201,122,0.08)', border: '1px solid rgba(232,201,122,0.25)',
    borderRadius: 10, padding: '11px 16px', marginBottom: 20,
    fontSize: 13, color: "var(--text2)", lineHeight: 1.5,
  },
  modalForm: { display: 'flex', flexDirection: 'column', gap: 0 },

  section: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: 7,
    fontSize: 11, fontWeight: 800, color: "var(--blue)",
    textTransform: 'uppercase', letterSpacing: '0.09em',
    paddingBottom: 10, borderBottom: '1px solid var(--bg3)',
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },

  // Poster
  posterLabel: {
    display: 'block', cursor: 'pointer', borderRadius: 12,
    border: '2px dashed var(--border)', overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  posterPlaceholder: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '32px 16px',
    background: "var(--bg)",
  },
  posterImg: { width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' },
  removeBtn: {
    background: 'none', border: '1px solid rgba(248,113,113,0.3)', color: "var(--red)",
    borderRadius: 8, padding: '5px 12px', fontSize: 12, alignSelf: 'flex-start',
  },
  linkInput: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: "var(--bg2)", border: '1.5px solid var(--border)',
    borderRadius: 10, padding: '10px 14px',
  },

  // Event heads
  headCard: {
    background: "var(--bg)", border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px',
  },
  headCardTitle: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  headBadge: {
    background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
    color: "var(--purple)", borderRadius: 99, padding: '3px 10px',
    fontSize: 11, fontWeight: 700,
  },
  headGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },

  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'linear-gradient(135deg,var(--blue),var(--blue2))', color: '#fff',
    border: 'none', borderRadius: 12, padding: '14px', fontSize: 15,
    fontWeight: 700, marginTop: 8, transition: 'all 0.2s',
    boxShadow: '0 4px 20px rgba(91,141,238,0.4)',
  },
  spinnerInline: {
    width: 17, height: 17, border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', display: 'block',
  },
};