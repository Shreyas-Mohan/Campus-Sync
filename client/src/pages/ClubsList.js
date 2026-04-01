import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import { toast } from 'react-hot-toast';
import { Search, Compass, Users } from 'lucide-react';
import { MdVerified } from 'react-icons/md';

export default function ClubsList() {
  const { token, user } = useAuth();
  const { isDark } = useTheme();
  
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Theme definition
  const th = isDark ? {
    bg: '#0d1117', text: '#f0f0f0', cardBtn: '#1c1f27', border: '#2d3342', muted: '#8b949e', link: '#58a6ff'
  } : {
    bg: '#ffffff', text: '#0d1526', cardBtn: '#f0f4ff', border: '#d1daf0', muted: '#5c6b8c', link: '#0052cc'
  };

  const CS = {
    container: { minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' },
    content: { maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem', marginTop: 70 },
    header: { marginBottom: '2rem' },
    title: { fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' },
    subtitle: { color: th.muted, fontSize: '1.1rem' },
    searchBox: {
      display: 'flex', alignItems: 'center', background: th.cardBtn, border: `1px solid ${th.border}`,
      borderRadius: 12, padding: '0 1rem', marginTop: '1.5rem', maxWidth: 500
    },
    searchInput: {
      border: 'none', background: 'transparent', padding: '0.8rem', color: th.text, width: '100%', outline: 'none'
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
    card: {
      background: th.cardBtn, border: `1px solid ${th.border}`, borderRadius: 16, padding: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', textDecoration: 'none', color: th.text
    },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '1rem' },
    logoBox: {
      width: 60, height: 60, borderRadius: '50%', background: th.border,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0
    },
    clubName: { fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: 6 },
    badgeVerified: { color: '#1d9bf0', fontSize: 16 },
    followersText: { color: th.muted, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 4 },
    desc: { color: th.muted, fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    btnPrimary: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', zIndex: 10 },
    btnSecondary: { background: 'transparent', color: th.text, border: `1px solid ${th.border}`, padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', zIndex: 10 }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClubs(res.data);
    } catch (err) {
      toast.error('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (e, clubId, isFollowing, name) => {
    e.preventDefault(); // Prevent Link click
    try {
      const route = isFollowing ? 'unfollow' : 'follow';
      await axios.post(`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/clubs/${clubId}/${route}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      
      setClubs(prev => prev.map(c => {
        if (c._id === clubId) {
          return {
            ...c,
            followers: isFollowing 
              ? c.followers.filter(fid => fid !== user?.id)
              : [...(c.followers || []), user?.id]
          };
        }
        return c;
      }));
      toast.success(isFollowing ? `Unfollowed ${name}` : `Following ${name}`);
    } catch (err) {
      toast.error('Failed to update follow status');
    }
  };

  const filtered = clubs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={CS.container}>
      <Navbar title="Clubs" />
      <div style={CS.content}>
        <div style={CS.header}>
          <h1 style={CS.title}><Compass size={32} color="var(--primary)" /> Explore Clubs</h1>
          <p style={CS.subtitle}>Discover and follow the official clubs at IIITM.</p>
          
          <div style={CS.searchBox}>
            <Search size={18} color={th.muted} />
            <input 
              placeholder="Search clubs by name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={CS.searchInput} 
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: th.muted }}>Loading clubs...</div>
        ) : (
          <div style={CS.grid}>
            {filtered.map(club => {
              const isFollowing = club.followers?.includes(user?.id);
              const isClubUser = user?.role === 'club';

              return (
                <Link to={`/club/${club.slug || club._id}`} key={club._id} style={CS.card} className="club-card-hover">
                  <div style={CS.cardHeader}>
                    <div style={CS.logoBox}>
                      {club.logo ? (
                        <img src={club.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 24, fontWeight: 700, color: th.muted }}>{club.name.charAt(0)}</span>
                      )}
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={CS.clubName}>
                        {club.name}
                        {club.isVerified && <MdVerified style={CS.badgeVerified} title="Verified Club" />}
                      </h3>
                      <div style={CS.followersText}>
                        <Users size={14} /> {club.followers?.length || 0} Followers
                      </div>
                    </div>
                  </div>
                  
                  {club.description && (
                    <div style={CS.desc}>{club.description}</div>
                  )}

                  {!isClubUser && (
                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                      <button 
                        onClick={(e) => handleFollowToggle(e, club._id, isFollowing, club.name)}
                        style={isFollowing ? CS.btnSecondary : CS.btnPrimary}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .club-card-hover:hover {
          transform: translateY(-4px) !important;
          border-color: var(--primary) !important;
        }
      `}</style>
    </div>
  );
}
