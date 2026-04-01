import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { PlusCircle, X, CheckCircle, Clock, Upload, Link as LinkIcon, FileText, User, Activity, BarChart2, Zap, Compass, ChevronRight } from 'lucide-react';

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
  const [events,        setEvents]        = useState([]);
  const [modal,         setModal]         = useState(false);
  const [clubModal,     setClubModal]     = useState(false);
  const [editData,      setEditData]      = useState(null);
  const [tab,           setTab]           = useState('all');
  const [form,          setForm]          = useState(BLANK);
  const [posterPreview, setPosterPreview] = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [clubForm,      setClubForm]      = useState({
    description: '', coverImage: '', logo: '', isRecruiting: false,
    socialLinks: { instagram: '', linkedin: '', website: '' },
    coreTeam: [] // we can start with empty array if they want to edit later, or build a simple string to object map
  });

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

  const fetchClubProfile = async () => {
    if (!isClub) return;
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/clubs/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClubForm({
        description: data.description || '',
        coverImage: data.coverImage || '',
        logo: data.logo || '',
        isRecruiting: data.isRecruiting || false,
        socialLinks: data.socialLinks || { instagram: '', linkedin: '', website: '' }
      });
    } catch {}
  };

  useEffect(() => { 
    fetchEvents(); 
    if (isClub) fetchClubProfile();
  }, [isClub]);

  const setHead = (head, field, value) =>
    setForm(f => ({ ...f, [head]: { ...f[head], [field]: value } }));

  const handlePosterChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setForm(f => ({ ...f, poster: base64 }));
      setPosterPreview(base64);
    } catch { toast.error('Failed to read image'); }
  };

  const openCreate = () => {
    setEditData(null); setForm(BLANK); setPosterPreview(null); setModal(true);
  };

  const openEdit = (event) => {
    setEditData(event);
    setForm({
      title:               event.title,
      description:         event.description         || '',
      detailedDescription: event.detailedDescription || '',
      category:            event.category            || 'Tech',
      date:                event.date ? event.date.slice(0, 16) : '',
      venue:               event.venue,
      tags:                event.tags?.join(', ')    || '',
      maxCapacity:         event.maxCapacity          || '',
      poster:              event.poster               || '',
      applicationLink:     event.applicationLink      || '',
      eventHead1:          event.eventHead1           || { name: '', rollNo: '', contact: '' },
      eventHead2:          event.eventHead2           || { name: '', rollNo: '', contact: '' },
      needsReapproval: false,
      reapprovalNote: ''
    });
    setPosterPreview(event.poster || null);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      organizerName: user.name,
    };
    try {
      if (editData) {
        await axios.put(`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/events/${editData._id}`, payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(payload.needsReapproval ? 'Edit submitted for faculty review!' : 'Event updated successfully! ✨');
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events`, payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Event submitted for approval! 🎉');
      }
      setModal(false);
      fetchEvents();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleClubSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/clubs/${user.id}`, clubForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Club profile updated successfully!');
      setClubModal(false);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => setEvents(prev => prev.filter(e => e._id !== id));

  const myEvents = isOrganizer
    ? events.filter(e => e.organizer === user.id || e.organizerName === user.name || e.club === user.id || e?.club?._id === user.id)
    : events;

  const filtered =
    tab === 'pending'  ? myEvents.filter(e => e.status === 'pending')  :
    tab === 'approved' ? myEvents.filter(e => e.status === 'approved') :
    myEvents;

  const stats = {
    total:     myEvents.length,
    approved:  myEvents.filter(e => e.status === 'approved').length,
    pending:   myEvents.filter(e => e.status === 'pending').length,
    totalRsvp: myEvents.reduce((s, e) => s + (e.rsvpCount || 0), 0),
  };

  const STAT_CARDS = isFaculty
    ? [
        { label: 'Approved', value: stats.approved, color: "var(--green)", bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)', Icon: CheckCircle },
        { label: 'Pending Review', value: stats.pending,  color: "var(--accent)", bg: 'rgba(232,201,122,0.08)', border: 'rgba(232,201,122,0.2)', Icon: Clock },
      ]
    : isAdmin
    ? [
        { label: 'Total Events', value: stats.total,    color: "var(--blue)", bg: "var(--blue-dim)",   border: 'rgba(91,141,238,0.2)',   Icon: Activity },
        { label: 'Approved',     value: stats.approved,  color: "var(--green)", bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.2)',   Icon: CheckCircle },
        { label: 'Pending',      value: stats.pending,   color: "var(--accent)", bg: 'rgba(232,201,122,0.08)', border: 'rgba(232,201,122,0.2)',  Icon: Clock },
      ]
    : [
        { label: 'Total Events', value: stats.total,     color: "var(--blue)", bg: "var(--blue-dim)",   border: 'rgba(91,141,238,0.2)',   Icon: Activity },
        { label: 'Approved',     value: stats.approved,  color: "var(--green)", bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.2)',   Icon: CheckCircle },
        { label: 'Pending',      value: stats.pending,   color: "var(--accent)", bg: 'rgba(232,201,122,0.08)', border: 'rgba(232,201,122,0.2)',  Icon: Clock }
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
            {isFaculty ? 'Event Approvals' : `Hello, ${user?.name?.split(' ')[0]}`}
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
                <button onClick={() => setClubModal(true)} style={{...S.createBtn, background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)'}}>
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
        {/* ── Stats ── */}
        <div style={S.statsRow}>
          {STAT_CARDS.map(({ label, value, color, bg, border, Icon }) => (
            <div key={label} style={{ ...S.statCard, background: bg, borderColor: border }}>
              <div style={S.statIconWrap}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ ...S.statNum, color }}>{value}</div>
              <div style={S.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={S.tabs}>
          {[['all','All Events'],['pending','Pending'],['approved','Approved']].map(([val, lbl]) => (
            <button key={val} onClick={() => setTab(val)}
              style={{ ...S.tabBtn, ...(tab === val ? S.tabBtnOn : {}) }}>
              {lbl}
              {val === 'pending' && stats.pending > 0 && (
                <span style={S.pendingBadge}>{stats.pending}</span>
              )}
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
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Club Profile Modal ── */}
      {clubModal && (
        <div style={S.overlay} onClick={() => setClubModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHead}>
              <div>
                <h2 style={S.modalTitle}>👤 Edit Club Profile</h2>
                <p style={S.modalSub}>Update your campus presence and social links.</p>
              </div>
              <button onClick={() => setClubModal(false)} style={S.closeBtn}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleClubSubmit} style={S.modalForm}>
              <div style={S.section}>
                <div style={S.sectionLabel}><FileText size={13} /> Basic Information</div>
                <div style={S.fieldGroup}>
                  <textarea placeholder="Club Description" value={clubForm.description}
                    onChange={e => setClubForm({...clubForm, description: e.target.value})} rows={3} style={{ resize: 'vertical' }} />
                  
                  <div style={S.row2}>
                    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--text2)' }}>Cover Image</span>
                      <input type="file" accept="image/*"
                         onChange={e => {
                           const file = e.target.files[0];
                           if(file) {
                             const reader = new FileReader();
                             reader.onloadend = () => setClubForm({...clubForm, coverImage: reader.result});
                             reader.readAsDataURL(file);
                           }
                         }} 
                      />
                    </label>
                    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--text2)' }}>Logo Image</span>
                      <input type="file" accept="image/*"
                         onChange={e => {
                           const file = e.target.files[0];
                           if(file) {
                             const reader = new FileReader();
                             reader.onloadend = () => setClubForm({...clubForm, logo: reader.result});
                             reader.readAsDataURL(file);
                           }
                         }}
                      />
                    </label>
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: "var(--text)", marginTop: 8 }}>
                    <input type="checkbox" checked={clubForm.isRecruiting} 
                      onChange={e => setClubForm({...clubForm, isRecruiting: e.target.checked})} />
                    We are currently recruiting new members!
                  </label>
                </div>
              </div>

              <div style={S.section}>
                <div style={S.sectionLabel}><LinkIcon size={13} /> Social Links</div>
                <div style={S.fieldGroup}>
                  <input placeholder="Instagram Link" value={clubForm.socialLinks.instagram}
                    onChange={e => setClubForm({...clubForm, socialLinks: {...clubForm.socialLinks, instagram: e.target.value}})} />
                  <input placeholder="LinkedIn Link" value={clubForm.socialLinks.linkedin}
                    onChange={e => setClubForm({...clubForm, socialLinks: {...clubForm.socialLinks, linkedin: e.target.value}})} />
                  <input placeholder="Website Link" value={clubForm.socialLinks.website}
                    onChange={e => setClubForm({...clubForm, socialLinks: {...clubForm.socialLinks, website: e.target.value}})} />
                </div>
              </div>
              
              <button type="submit" style={{ ...S.submitBtn, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
                {submitting ? 'Saving...' : '💾 Save Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div style={S.overlay} onClick={() => setModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={S.modalHead}>
              <div>
                <h2 style={S.modalTitle}>{editData ? '✏️ Edit Event' : '✦ Create Event'}</h2>
                <p style={S.modalSub}>
                  {editData ? 'Changes will require re-approval' : 'Submit for faculty review'}
                </p>
              </div>
              <button onClick={() => setModal(false)} style={S.closeBtn}><X size={18} /></button>
            </div>

            {editData && (
              <div style={S.editBanner}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                  <input type="checkbox" checked={form.needsReapproval} onChange={e => setForm({...form, needsReapproval: e.target.checked})} style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  ⚠️ This vital change requires Faculty Re-approval (Date/Venue/Max Capacity)
                </label>
                {form.needsReapproval ? (
                  <textarea
                    placeholder="Briefly explain this change to the faculty..."
                    value={form.reapprovalNote}
                    onChange={e => setForm({...form, reapprovalNote: e.target.value})}
                    style={{ marginTop: 10, width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '8px 10px', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical' }}
                    rows={2}
                  />
                ) : (
                  <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text2)', marginLeft: 23 }}>
                    Turn this on only if the event logistics changed structurally. Minor edits (typos, posters) save immediately.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} style={S.modalForm}>

              {/* ── Basic Info ── */}
              <div style={S.section}>
                <div style={S.sectionLabel}><FileText size={13} /> Basic Information</div>
                <div style={S.fieldGroup}>
                  <input placeholder="Event title *" value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})} required />
                  <textarea placeholder="Short description (shown on event card)"
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    rows={2} style={{ resize: 'vertical' }} />
                  <div>
                    <textarea placeholder="Detailed description — agenda, prizes, eligibility, rules…"
                      value={form.detailedDescription}
                      onChange={e => setForm({...form, detailedDescription: e.target.value})}
                      rows={5} style={{ resize: 'vertical' }} />
                    <p style={{fontSize: 11, color: 'var(--muted)', marginTop: 4, marginLeft: 2}}>
                      ✨ Markdown supported: **bold**, *italic*, - lists
                    </p>
                  </div>
                  <div style={S.row2}>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input type="datetime-local" value={form.date}
                      onChange={e => setForm({...form, date: e.target.value})} required />
                  </div>
                  <div style={S.row2}>
                    <input placeholder="Venue *" value={form.venue}
                      onChange={e => setForm({...form, venue: e.target.value})} required />
                    <input type="number" placeholder="Max capacity" value={form.maxCapacity}
                      onChange={e => setForm({...form, maxCapacity: e.target.value})} />
                  </div>
                  <input placeholder="Tags — comma separated (e.g. Free, Workshop, Coding)"
                    value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
                </div>
              </div>

              {/* ── Poster & Link ── */}
              <div style={S.section}>
                <div style={S.sectionLabel}><Upload size={13} /> Poster &amp; Registration</div>
                <div style={S.fieldGroup}>
                  <label htmlFor="poster-upload" style={S.posterLabel}>
                    {posterPreview ? (
                      <img src={posterPreview} alt="preview" style={S.posterImg} />
                    ) : (
                      <div style={S.posterPlaceholder}>
                        <Upload size={26} color="var(--blue)" />
                        <span style={{ color: "var(--text2)", fontSize: 13, marginTop: 8 }}>
                          Click to upload event poster
                        </span>
                        <span style={{ color: "var(--muted)", fontSize: 11, marginTop: 3 }}>
                          JPG · PNG · GIF · WEBP
                        </span>
                      </div>
                    )}
                  </label>
                  <input id="poster-upload" type="file" accept="image/*"
                    style={{ display: 'none' }} onChange={handlePosterChange} />
                  {posterPreview && (
                    <button type="button" style={S.removeBtn}
                      onClick={() => { setForm(f => ({...f, poster:''})); setPosterPreview(null); }}>
                      ✕ Remove poster
                    </button>
                  )}

                  <div style={S.linkInput}>
                    <LinkIcon size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
                    <input
                      placeholder="Application / Registration link (https://…)"
                      value={form.applicationLink}
                      onChange={e => setForm({...form, applicationLink: e.target.value})}
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: "var(--text)", fontSize: 14 }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Event Heads ── */}
              <div style={S.section}>
                <div style={S.sectionLabel}><User size={13} /> Event Heads</div>
                <div style={S.fieldGroup}>
                  {[1, 2].map(n => (
                    <div key={n} style={S.headCard}>
                      <div style={S.headCardTitle}>
                        <span style={S.headBadge}>Head {n}</span>
                        {form[`eventHead${n}`].name && (
                          <span style={{ color: "var(--text2)", fontSize: 12 }}>{form[`eventHead${n}`].name}</span>
                        )}
                      </div>
                      <div style={S.headGrid}>
                        <input placeholder="Full Name"
                          value={form[`eventHead${n}`].name}
                          onChange={e => setHead(`eventHead${n}`, 'name', e.target.value)} />
                        <input placeholder="Roll Number"
                          value={form[`eventHead${n}`].rollNo}
                          onChange={e => setHead(`eventHead${n}`, 'rollNo', e.target.value)} />
                        <input placeholder="Contact Number" style={{ gridColumn: '1 / -1' }}
                          value={form[`eventHead${n}`].contact}
                          onChange={e => setHead(`eventHead${n}`, 'contact', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" style={{ ...S.submitBtn, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
                {submitting ? (
                  <><span style={S.spinnerInline} /> Submitting…</>
                ) : (
                  <>{editData ? '💾 Save Changes' : '🚀 Submit for Approval'}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
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