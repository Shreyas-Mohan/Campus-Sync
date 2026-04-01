import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { Search, Compass, Bookmark, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';

const CATS = ['All','Tech','Music','Sports','Culture','Business','Art','Science','Social'];
const CAT_ICONS = { All:'✦', Tech:'💻', Music:'🎵', Sports:'⚽', Culture:'🎭', Business:'💼', Art:'🎨', Science:'🔬', Social:'🎉' };
const CAT_COLORS = { Tech:"var(--blue)", Music:"var(--purple)", Sports:"var(--green)", Culture:"var(--orange)", Business:'#60a5fa', Art:"var(--pink)", Science:"var(--teal)", Social:'#fbbf24' };

export default function StudentFeed() {
  const { token, user }  = useAuth();
  const [events,    setEvents]    = useState([]);
  const [myRsvpIds, setMyRsvpIds] = useState(new Set());
  const [myEvents,  setMyEvents]  = useState([]);
  const [search,    setSearch]    = useState('');
  const [cat,       setCat]       = useState('All');
  const [tab,       setTab]       = useState('discover'); // 'discover' | 'past' | 'mine'
  const [loading,   setLoading]   = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(data);
    } finally { setLoading(false); }
  };

  const fetchMyRsvps = async () => {
    try {
      const [idsRes, eventsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/rsvp/mine/ids`,  { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/rsvp/mine`,      { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setMyRsvpIds(new Set(idsRes.data));
      setMyEvents(eventsRes.data);
    } catch {}
  };

  useEffect(() => { fetchEvents(); fetchMyRsvps(); }, []);

  const handleRsvpToggle = (eventId, isNowRsvpd) => {
    setMyRsvpIds(prev => {
      const next = new Set(prev);
      isNowRsvpd ? next.add(eventId) : next.delete(eventId);
      return next;
    });
    if (isNowRsvpd) {
      const ev = events.find(e => e._id === eventId);
      if (ev) setMyEvents(prev => [...prev, ev]);
    } else {
      setMyEvents(prev => prev.filter(e => e._id !== eventId));
    }
  };

  const filtered = events.filter(e => {
    const matchCat    = cat === 'All' || e.category === cat;
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase())
      || e.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const isPastEvent = (d) => new Date(d) < new Date();
  const activeEvents = filtered.filter(e => !isPastEvent(e.date));
  const pastEvents = filtered.filter(e => isPastEvent(e.date));

  const forYou = user?.interests?.length
    ? activeEvents.filter(e => user.interests.includes(e.category))
    : [];

  const upcoming = [...activeEvents]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '🌅 Good morning' : hour < 17 ? '☀️ Good afternoon' : '🌙 Good evening';

  const SkeletonCard = () => (
    <div style={S.skeletonCard}>
      <div style={S.skeletonHeader} className="skeleton" />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 14, width: '40%', borderRadius: 8 }} className="skeleton" />
        <div style={{ height: 18, width: '85%', borderRadius: 8 }} className="skeleton" />
        <div style={{ height: 13, width: '60%', borderRadius: 8 }} className="skeleton" />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: "var(--bg)" }}>
      <Navbar title="Discover" />

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div style={S.hero}>
        <div style={S.heroGlow1} /><div style={S.heroGlow2} />
        <div style={S.heroContent}>
          <div style={S.heroHeaderRow}>
            <div>
              <div style={S.greetingChip}>
                <Sparkles size={12} /> Campus Feed
              </div>
              <h1 style={S.heroH}>
                {greeting}, <span style={S.heroName}>{user?.name?.split(' ')[0]}</span>
              </h1>
              <p style={S.heroSub}>Discover {events.length} events happening on campus</p>
            </div>
            
            <div style={S.heroActions}>
              <Link to="/club" style={{ textDecoration: 'none' }}>
                <div style={S.exploreBtn}>
                  <Compass size={18} /> Explore clubs of IIITM <ChevronRight size={18} />
                </div>
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <div style={S.searchBox}>
            <Search size={16} color="var(--muted)" />
            <input
              placeholder="Search events, categories, venues…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={S.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} style={S.clearBtn}>✕</button>
            )}
          </div>
        </div>
      </div>

      <div style={S.container}>
        <div style={S.mainColumn}>
          {/* ── Main Tabs ── */}
          <div style={S.tabRow}>
            <button
              onClick={() => setTab('discover')}
              style={{ ...S.mainTab, ...(tab === 'discover' ? S.mainTabOn : {}) }}
            >
              <Compass size={14} />
              Discover
            </button>
            <button
              onClick={() => setTab('past')}
              style={{ ...S.mainTab, ...(tab === 'past' ? S.mainTabOn : {}) }}
            >
              <Sparkles size={14} />
              Past Events
            </button>
            <button
              onClick={() => setTab('mine')}
              style={{ ...S.mainTab, ...(tab === 'mine' ? S.mainTabOn : {}) }}
            >
              <Bookmark size={14} />
              My Events
              {myEvents.length > 0 && (
                <span style={S.countBadge}>{myEvents.length}</span>
              )}
            </button>
          </div>

          {/* ── DISCOVER tab ── */}
          {tab === 'discover' && (
            <>
              {/* Category filter pills */}
              <div style={S.catRow}>
                {CATS.map(c => {
                  const active = cat === c;
                  const col = CAT_COLORS[c] || "var(--blue)";
                  return (
                    <button key={c} onClick={() => setCat(c)}
                      style={{
                        ...S.catPill,
                        ...(active ? {
                          background: col + '18',
                          border: `1.5px solid ${col}55`,
                          color: col,
                        } : {}),
                      }}>
                      {CAT_ICONS[c]} {c}
                    </button>
                  );
                })}
              </div>

              {/* For You section */}
              {forYou.length > 0 && !search && cat === 'All' && (
                <section style={{ marginBottom: 40 }}>
                  <div style={S.sectionHead}>
                    <div>
                      <h2 style={S.sectionTitle}>✦ Picked for you</h2>
                      <p style={S.sectionSub}>Based on your interests</p>
                    </div>
                    <button style={S.seeAll}>See all <ChevronRight size={13} /></button>
                  </div>
                  {loading
                    ? <div style={S.grid}>{[1,2].map(k => <SkeletonCard key={k} />)}</div>
                    : <div style={S.grid}>
                        {forYou.slice(0, 2).map(e => (
                          <EventCard key={e._id} event={e}
                            initialRsvpd={myRsvpIds.has(e._id)}
                            onRsvpToggle={handleRsvpToggle} />
                        ))}
                      </div>}
                </section>
              )}

              {/* All Events */}
              <section>
                <div style={S.sectionHead}>
                  <div>
                    <h2 style={S.sectionTitle}>
                      {cat !== 'All' ? `${CAT_ICONS[cat]} ${cat} events` : 'All events'}
                    </h2>
                    {!loading && (
                      <p style={S.sectionSub}>{activeEvents.length} event{activeEvents.length !== 1 ? 's' : ''} found</p>
                    )}
                  </div>
                </div>
                {loading ? (
                  <div style={S.grid}>{[1,2,3,4].map(k => <SkeletonCard key={k} />)}</div>
                ) : activeEvents.length === 0 ? (
                  <div style={S.emptyState}>
                    <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
                    <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                      {search ? `No events found matching "${search}"` : `No upcoming events found`}
                    </p>
                    <p style={{ color: "var(--muted)", fontSize: 14 }}>Try tweaking your search or exploring different categories</p>
                    <button onClick={() => { setSearch(''); setCat('All'); }} style={S.resetBtn}>
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div style={S.grid}>
                    {activeEvents.map(e => (
                      <EventCard key={e._id} event={e}
                        initialRsvpd={myRsvpIds.has(e._id)}
                        onRsvpToggle={handleRsvpToggle} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ── PAST EVENTS tab ── */}
          {tab === 'past' && (
            <section>
              <div style={S.sectionHead}>
                <div>
                  <h2 style={S.sectionTitle}>⏳ Past Events</h2>
                  {!loading && (
                    <p style={S.sectionSub}>{pastEvents.length} event{pastEvents.length !== 1 ? 's' : ''} found</p>
                  )}
                </div>
              </div>
              {loading ? (
                <div style={S.grid}>{[1,2,3,4].map(k => <SkeletonCard key={k} />)}</div>
              ) : pastEvents.length === 0 ? (
                <div style={S.emptyState}>
                  <p style={{ fontSize: 48, marginBottom: 12 }}>🕰️</p>
                  <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>No past events</p>
                </div>
              ) : (
                <div style={S.grid}>
                  {pastEvents.map(e => (
                    <EventCard key={e._id} event={e}
                      initialRsvpd={myRsvpIds.has(e._id)}
                      onRsvpToggle={handleRsvpToggle} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── MY EVENTS tab ── */}
          {tab === 'mine' && (
            <section>
              <div style={S.sectionHead}>
                <div>
                  <h2 style={S.sectionTitle}>📅 Events you're attending</h2>
                  <p style={S.sectionSub}>{myEvents.length} event{myEvents.length !== 1 ? 's' : ''} in your schedule</p>
                </div>
              </div>
              {myEvents.length === 0 ? (
                <div style={S.emptyState}>
                  <p style={{ fontSize: 48, marginBottom: 12 }}>📭</p>
                  <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>No RSVPs yet</p>
                  <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
                    Browse events and tap RSVP to save them here
                  </p>
                  <button onClick={() => setTab('discover')} style={S.resetBtn}>
                    Discover events →
                  </button>
                </div>
              ) : (
                <div style={S.grid}>
                  {myEvents.map(e => (
                    <EventCard key={e._id} event={e}
                      initialRsvpd={true}
                      onRsvpToggle={handleRsvpToggle} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* ── SECOND COLUMN (Sidebar) ── */}
        <div style={S.sidebar}>
          {/* Trending / Upcoming */}
          {(!search || upcoming.length > 0) && (
            <section style={S.sidebarSection}>
              <div style={{...S.sectionHead, marginBottom: 14}}>
                <div>
                  <h2 style={{...S.sectionTitle, fontSize: 18}}>
                    <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: 6, color: "var(--accent)" }} />
                    Coming up soon
                  </h2>
                </div>
              </div>
              {upcoming.length === 0 ? (
                <p style={{color: "var(--muted)", fontSize: 14}}>No upcoming events...</p>
              ) : (
                <div style={S.upcomingRow}>
                  {upcoming.map(e => (
                    <div key={e._id} style={S.upcomingItem}>
                      <div style={{ ...S.upcomingAccent, background: CAT_COLORS[e.category] || "var(--blue)" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={`/events/${e._id}`} style={{ textDecoration: 'none' }}>
                          <p style={S.upcomingTitle}>{e.title}</p>
                        </Link>
                        <p style={S.upcomingMeta}>
                          {new Date(e.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} · {e.venue}
                        </p>
                      </div>
                      <span style={S.upcomingCount}>
                        {e.rsvpCount || 0} going
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  hero: {
    position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(180deg, #0d1020 0%, var(--bg) 100%)',
    borderBottom: '1px solid var(--bg3)', padding: '48px 28px 40px',
    marginBottom: 0,
  },
  heroGlow1: {
    position: 'absolute', top: '-30%', left: '20%', width: 700, height: 700,
    borderRadius: '50%',
    background: 'radial-gradient(circle, var(--blue-dim) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  heroGlow2: {
    position: 'absolute', bottom: '-20%', right: '10%', width: 500, height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  heroContent: {
    maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1,
    animation: 'fadeUp 0.5s ease both',
  },
  heroHeaderRow: {
    display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '20px'
  },
  heroActions: {
    display: 'flex', gap: '12px', alignItems: 'center'
  },
  exploreBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', 
    background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.3)',
    padding: '0.6rem 1.2rem', borderRadius: '20px', color: 'var(--purple)', 
    fontWeight: 600, transition: '0.2s', cursor: 'pointer'
  },
  greetingChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: "var(--blue-dim)", border: '1px solid var(--blue-border)',
    color: "var(--blue)", borderRadius: 99, padding: '5px 14px',
    fontSize: 12, fontWeight: 600, marginBottom: 14,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  heroH: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 40, color: "var(--text)", marginBottom: 6,
    lineHeight: 1.1,
  },
  heroName: {
    background: 'linear-gradient(135deg, var(--blue), var(--purple))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heroSub: { color: "var(--muted)", fontSize: 15, marginBottom: 24 },

  searchBox: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: "var(--glass-bg)", border: '1.5px solid var(--border)',
    borderRadius: 14, padding: '13px 18px',
    backdropFilter: 'blur(12px)',
    maxWidth: 400,
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    transition: 'border-color 0.2s',
  },
  searchInput: {
    background: 'none', border: 'none', color: "var(--text)",
    flex: 1, outline: 'none', fontSize: 15,
  },
  clearBtn: {
    background: 'none', border: 'none', color: "var(--muted)",
    fontSize: 14, padding: '0 4px', transition: 'color 0.2s',
  },

  container: { 
    maxWidth: 1200, margin: '0 auto', padding: '32px 28px 64px',
    display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap'
  },
  mainColumn: {
    flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0
  },
  sidebar: {
    flex: '0 0 320px', position: 'sticky', top: '100px',
    display: 'flex', flexDirection: 'column', gap: '24px'
  },
  sidebarSection: {
    background: "var(--bg2)", border: '1px solid var(--border)', borderRadius: 16,
    padding: '20px'
  },

  tabRow: { display: 'flex', gap: 6, marginBottom: 28 },
  mainTab: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '10px 20px', borderRadius: 12, border: '1.5px solid var(--border)',
    background: "var(--glass-bg)", color: "var(--text2)",
    fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
  },
  mainTabOn: {
    background: "var(--blue-dim)", border: '1.5px solid var(--blue-border)',
    color: "var(--blue)",
  },
  countBadge: {
    background: "var(--blue)", color: '#fff', borderRadius: 99,
    fontSize: 11, fontWeight: 700, padding: '1px 7px',
  },

  catRow: {
    display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 32,
    paddingBottom: 12, // Increased padding so scrollbar doesn't overlap pills
  },
  catPill: {
    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
    padding: '8px 16px', borderRadius: 99, border: '1.5px solid var(--border)',
    background: "var(--glass-bg)", color: "var(--text2)",
    fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },

  sectionHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "var(--text)",
  },
  sectionSub: { color: "var(--muted)", fontSize: 13, marginTop: 3 },
  seeAll: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'none', border: 'none', color: "var(--blue)",
    fontSize: 13, fontWeight: 600,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 18, marginBottom: 8,
  },

  upcomingRow: {
    display: 'flex', flexDirection: 'column', gap: 0,
  },
  upcomingItem: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 0', borderBottom: '1px solid var(--bg3)',
    transition: 'background 0.2s',
  },
  upcomingAccent: { width: 3, height: 36, borderRadius: 99, flexShrink: 0 },
  upcomingTitle: { fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  upcomingMeta:  { fontSize: 12, color: "var(--muted)" },
  upcomingCount: { fontSize: 12, color: "var(--text2)", whiteSpace: 'nowrap', marginLeft: 'auto', paddingLeft: 12 },

  emptyState: {
    textAlign: 'center', padding: '80px 24px',
    background: "var(--bg2)", border: '1px solid var(--border)',
    borderRadius: 16,
  },
  resetBtn: {
    marginTop: 16, background: "var(--blue-dim)", border: '1.5px solid var(--blue-border)',
    color: "var(--blue)", borderRadius: 10, padding: '10px 24px',
    fontSize: 14, fontWeight: 600,
  },

  skeletonCard: {
    background: "var(--bg2)", border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
  },
  skeletonHeader: { height: 120 },
};