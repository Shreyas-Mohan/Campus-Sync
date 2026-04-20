import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { Search, Compass, Bookmark, Sparkles, TrendingUp, ChevronRight, ChevronLeft } from 'lucide-react';

const CATS = ['All', 'Picked for you', 'Tech', 'Music', 'Sports', 'Culture', 'Business', 'Art', 'Science', 'Social'];
const CAT_ICONS = { All:'✦', 'Picked for you':'✨', Tech:'💻', Music:'🎵', Sports:'⚽', Culture:'🎭', Business:'💼', Art:'🎨', Science:'🔬', Social:'🎉' };
const CAT_COLORS = { Tech:"#8a2be2", 'Picked for you':'#8a2be2', Music:"#8a2be2", Sports:"#8a2be2", Culture:"#8a2be2", Business:'#8a2be2', Art:"#8a2be2", Science:"#8a2be2", Social:'#8a2be2' }; // Standardize on violet

export default function StudentFeed() {
  const { token, user }  = useAuth();
  const [events,    setEvents]    = useState([]);
  const [myRsvpIds, setMyRsvpIds] = useState(new Set());
  const [myEvents,  setMyEvents]  = useState([]);
  const [search,    setSearch]    = useState('');
  const [cat,       setCat]       = useState('All');
  const [tab,       setTab]       = useState('discover'); // 'discover' | 'past' | 'mine'
  const [loading,   setLoading]   = useState(true);
  const [serverTime, setServerTime] = useState(Date.now());
  const catScrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (catScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = catScrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollCats = (dir) => {
    if (catScrollRef.current) {
      const scrollAmount = 240;
      catScrollRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Extract accurate server time from the HTTP headers to avoid client timezone manipulation
      if (res.headers.date) {
        setServerTime(new Date(res.headers.date).getTime());
      }
      setEvents(res.data);
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
    let matchCat = true;
    if (cat === 'Picked for you') {
      matchCat = user?.interests?.length ? user.interests.includes(e.category) : false;
    } else if (cat !== 'All') {
      matchCat = e.category === cat;
    }
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase())
      || e.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const isPastEvent = (d) => new Date(d).getTime() < serverTime;
  const activeEvents = filtered.filter(e => !isPastEvent(e.date));
  const pastEvents = filtered.filter(e => isPastEvent(e.date));


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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={S.hero}>
        <div style={S.heroGlow1} /><div style={S.heroGlow2} />
        <div style={S.heroContent}>
          <div style={S.heroHeaderRow}>
            <div>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} style={S.greetingChip}>
                <Sparkles size={12} /> Campus Feed
              </motion.div>
              <h1 style={S.heroH}>
                {greeting}, <span style={S.heroName}>
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
                </span>
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
      </motion.div>

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
          <AnimatePresence mode="popLayout">
          {tab === 'discover' && (
            <motion.div key="discover" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {/* Category filter pills */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 32, gap: 12 }}>
                <AnimatePresence>
                  {showLeftArrow && (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      onClick={() => scrollCats('left')}
                      style={{ ...S.scrollBtn, position: 'relative', flexShrink: 0 }}
                    >
                      <ChevronLeft size={18} />
                    </motion.button>
                  )}
                </AnimatePresence>
                
                <div 
                  ref={catScrollRef}
                  style={{ ...S.catRow, marginBottom: 0, flex: 1 }}
                  className="no-scrollbar"
                  onScroll={handleScroll}
                >
                  {CATS.map(c => {
                    const active = cat === c;
                    const col = CAT_COLORS[c] || "#8a2be2";
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

                <AnimatePresence>
                  {showRightArrow && (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      onClick={() => scrollCats('right')}
                      style={{ ...S.scrollBtn, position: 'relative', flexShrink: 0 }}
                    >
                      <ChevronRight size={18} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>



              {/* All Events */}
              <section>
                <div style={S.sectionHead}>
                  <div>
                    <h2 style={S.sectionTitle}>
                      {cat !== 'All' ? `${CAT_ICONS[cat]} ${cat}${cat === 'Picked for you' ? '' : ' events'}` : 'All events'}
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
                  <motion.div style={S.grid} layout>
                    {activeEvents.map(e => (
                      <motion.div key={e._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <EventCard event={e}
                          initialRsvpd={myRsvpIds.has(e._id)}
                          onRsvpToggle={handleRsvpToggle} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </section>
            </motion.div>
          )}
          </AnimatePresence>

          {/* ── PAST EVENTS tab ── */}
          <AnimatePresence mode="popLayout">
          {tab === 'past' && (
            <motion.section key="past" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
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
                <motion.div style={S.grid} layout>
                  {pastEvents.map(e => (
                    <motion.div key={e._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <EventCard event={e}
                          initialRsvpd={myRsvpIds.has(e._id)}
                          onRsvpToggle={handleRsvpToggle} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.section>
          )}
          </AnimatePresence>

          {/* ── MY EVENTS tab ── */}
          <AnimatePresence mode="popLayout">
          {tab === 'mine' && (
            <motion.section key="mine" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div style={S.sectionHead}>
                <div>
                  <h2 style={S.sectionTitle}>📅 Events you're attending</h2>
                  {!loading && (
                    <p style={S.sectionSub}>{myEvents.length} event{myEvents.length !== 1 ? 's' : ''} in your schedule</p>
                  )}
                </div>
              </div>
              {loading ? (
                <div style={S.grid}>{[1,2,3,4].map(k => <SkeletonCard key={k} />)}</div>
              ) : myEvents.length === 0 ? (
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
                <motion.div style={S.grid} layout>
                  {myEvents.map(e => (
                    <motion.div key={e._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                      <EventCard event={e}
                        initialRsvpd={true}
                        onRsvpToggle={handleRsvpToggle} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.section>
          )}
          </AnimatePresence>
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
    display: 'flex', gap: 8, overflowX: 'auto', 
    padding: '4px 0 12px',
    scrollbarWidth: 'none', // for Firefox
    msOverflowStyle: 'none', // for IE/Edge
  },
  scrollBtn: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '50%', width: 32, height: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'all 0.2s', zIndex: 10,
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