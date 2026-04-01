import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import { toast } from 'react-hot-toast';
import { UserPlus, UserMinus, Globe, MapPin, Search, Calendar, Briefcase, ExternalLink, CheckCircle } from 'lucide-react';
import { FaInstagram, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';

export default function ClubProfile() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { isDark } = useTheme();

  const [club, setClub] = useState(null);
  const [events, setEvents] = useState({ upcoming: [], past: [] });
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  // Core team management states
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberTitle, setNewMemberTitle] = useState('');
  const [isManagingTeam, setIsManagingTeam] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  // Simple hardcoded theme palette similar to EventDetails to blend in.
  const th = isDark ? {
    bg: '#0d1117', text: '#f0f0f0', cardBtn: '#1c1f27', border: '#2d3342', muted: '#8b949e', link: '#58a6ff'
  } : {
    bg: '#ffffff', text: '#0d1526', cardBtn: '#f0f4ff', border: '#d1daf0', muted: '#5c6b8c', link: '#0052cc'
  };

  const CS = {
    container: { minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' },
    content: { maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem', marginTop: 70 },
    headerBox: {
      background: th.cardBtn, borderRadius: 16, border: `1px solid ${th.border}`, overflow: 'hidden', marginBottom: '2rem'
    },
    cover: {
      width: '100%', height: 250, objectFit: 'cover', background: th.border,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.muted
    },
    profileSection: {
      display: 'flex', gap: '1.5rem', padding: '0 2rem 2rem 2rem', marginTop: '-40px', position: 'relative'
    },
    logoBox: {
      width: 120, height: 120, borderRadius: '50%', background: th.cardBtn, 
      border: `4px solid ${th.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', 
      flexShrink: 0, overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    },
    logoText: { fontSize: 40, fontWeight: 700, color: 'var(--primary)' },
    infoBox: { paddingTop: 50, flexGrow: 1 },
    clubName: { fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: 8 },
    badgeVerified: { fontSize: 13, background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 },
    badgeRecruiting: { fontSize: 13, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--green)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: 16, fontWeight: 700, letterSpacing: '0.02em' },
    desc: { color: th.muted, lineHeight: 1.6, marginBottom: '1.5rem', whiteSpace: 'pre-wrap' },
    
    actionRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
    btnPrimary: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
    btnSecondary: { background: 'transparent', color: th.text, border: `1px solid ${th.border}`, padding: '0.6rem 1.2rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
    tagRow: { display: 'flex', gap: '1rem', marginTop: '1rem', color: th.muted, fontSize: 14, flexWrap: 'wrap' },

    teamGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' },
    teamCard: { background: th.cardBtn, border: `1px solid ${th.border}`, padding: '1.5rem', borderRadius: 12, textAlign: 'center' },
    teamName: { fontWeight: 700, marginBottom: '0.2rem', fontSize: 16 },
    teamRole: { color: 'var(--primary)', fontSize: 13, fontWeight: 600 },

    tabs: { display: 'flex', gap: '2rem', borderBottom: `1px solid ${th.border}`, marginBottom: '1.5rem' },
    tab: (active) => ({
      padding: '0.8rem 0', cursor: 'pointer', fontWeight: 600, fontSize: 16,
      color: active ? 'var(--primary)' : th.muted, borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent'
    }),
    eventsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
    socialIcon: { color: th.link, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontWeight: 500 }
  };

  useEffect(() => { fetchClubData(); }, [id]);

  const fetchClubData = async () => {
    try {
      setLoading(true);
      const [clubRes, eventsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/clubs/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/clubs/${id}/events`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setClub(clubRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      toast.error('Failed to load club profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const isFollowing = club.followers?.includes(user?.id);
      const route = isFollowing ? 'unfollow' : 'follow';
      await axios.post(`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/clubs/${club._id}/${route}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      
      // Optimitic update
      setClub(prev => ({
        ...prev,
        followers: isFollowing 
          ? prev.followers.filter(fid => fid !== user?.id)
          : [...(prev.followers || []), user?.id]
      }));
      toast.success(isFollowing ? `Unfollowed ${club.name}` : `Following ${club.name}`);
    } catch (err) {
      toast.error('Failed to update follow status');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail || !newMemberTitle) return toast.error('Please fill both fields');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/clubs/${club._id}/core-team`, {
        email: newMemberEmail,
        title: newMemberTitle
      }, { headers: { Authorization: `Bearer ${token}` } });
      setClub(res.data.club);
      setNewMemberEmail('');
      setNewMemberTitle('');
      toast.success('Member added successfully!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await axios.delete(`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/clubs/${club._id}/core-team/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClub(res.data.club);
      toast.success('Member removed successfully!');
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  if (loading) return <div style={CS.container}><Navbar title="Loading..."/><div style={CS.content}>Loading Club Profile...</div></div>;
  if (!club) return <div style={CS.container}><Navbar title="Not Found"/><div style={CS.content}>Club not found</div></div>;

  const isFollowing = club.followers?.includes(user?.id);

  return (
    <div style={CS.container}>
      <Navbar title={club.name} />
      <div style={CS.content}>
        
        {/* Header Section */}
        <div style={CS.headerBox}>
          {club.coverImage ? (
             <img src={club.coverImage} alt="Cover" style={CS.cover} />
          ) : (
            <div style={CS.cover}>No Cover Image</div>
          )}

          <div style={CS.profileSection}>
            <div style={CS.logoBox}>
              {club.logo ? (
                <img src={club.logo} alt="Logo" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <span style={CS.logoText}>{club.name.charAt(0)}</span>
              )}
            </div>

            <div style={CS.infoBox}>
              <h1 style={CS.clubName}>
                {club.name}
                {club.isVerified && <MdVerified color="#1d9bf0" size={26} title="Verified" style={{ marginLeft: '-2px' }} />}
                {club.isRecruiting && <span style={CS.badgeRecruiting}>We are Recruiting!</span>}
              </h1>
              
              <div style={CS.desc}>
                {club.description || 'Welcome to our official club page!'}
              </div>

              <div style={CS.actionRow}>
                {user.role !== 'club' && (
                  <button style={isFollowing ? CS.btnSecondary : CS.btnPrimary} onClick={handleFollowToggle}>
                    {isFollowing ? <><UserMinus size={18}/> Unfollow</> : <><UserPlus size={18}/> Follow</>}
                  </button>
                )}
                
                <div style={{display: 'flex', gap: '1.2rem', alignItems: 'center', marginLeft: 'auto'}}>
                  {club.email && (
                    <a href={`mailto:${club.email}`} title="Email" style={{...CS.socialIcon, color: th.text}}><FaEnvelope size={22}/></a>
                  )}
                  {club.socialLinks?.instagram && (
                    <a href={club.socialLinks.instagram} target="_blank" rel="noreferrer" title="Instagram" style={{...CS.socialIcon, color: '#E1306C'}}><FaInstagram size={24}/></a>
                  )}
                  {club.socialLinks?.linkedin && (
                    <a href={club.socialLinks.linkedin} target="_blank" rel="noreferrer" title="LinkedIn" style={{...CS.socialIcon, color: '#0A66C2'}}><FaLinkedin size={24}/></a>
                  )}
                  {club.socialLinks?.website && (
                    <a href={club.socialLinks.website} target="_blank" rel="noreferrer" title="Website" style={{...CS.socialIcon, color: th.link}}><Globe size={22}/></a>
                  )}
                </div>
              </div>
              <div style={CS.tagRow}>
                <span style={{ fontWeight: 600 }}>{club.followers?.length || 0} Followers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Team Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0', padding: '1.5rem', background: `linear-gradient(135deg, ${th.cardBtn}, rgba(167, 139, 250, 0.1))`, borderRadius: 12, border: `1px solid rgba(167, 139, 250, 0.2)` }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={20} color="var(--purple)"/> Core Team</h3>
            <p style={{ margin: 0, color: th.muted, fontSize: '0.95rem' }}>Meet the visionaries behind {club.name}.</p>
          </div>
          <button 
            style={{ ...CS.btnPrimary, background: 'var(--purple)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setShowTeamModal(true)}
          >
            Meet the Team <ExternalLink size={16} />
          </button>
        </div>

        {/* Events Portfolio */}
        <div style={CS.tabs}>
          <div style={CS.tab(activeTab === 'upcoming')} onClick={() => setActiveTab('upcoming')}>
            Upcoming Events ({events.upcoming?.length || 0})
          </div>
          <div style={CS.tab(activeTab === 'past')} onClick={() => setActiveTab('past')}>
            Past Events ({events.past?.length || 0})
          </div>
        </div>

        <div style={CS.eventsGrid}>
          {activeTab === 'upcoming' && events.upcoming?.length === 0 && <div style={{color: th.muted}}>No upcoming events planned.</div>}
          {activeTab === 'upcoming' && events.upcoming?.map(ev => <EventCard key={ev._id} event={ev} />)}
          
          {activeTab === 'past' && events.past?.length === 0 && <div style={{color: th.muted}}>No past events found.</div>}
          {activeTab === 'past' && events.past?.map(ev => <EventCard key={ev._id} event={ev} />)}
        </div>

      </div>

      {/* Core Team Modal Overlay */}
      {showTeamModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{ 
            background: th.bg, width: '100%', maxWidth: 600, maxHeight: '85vh', 
            borderRadius: 16, border: `1px solid ${th.border}`, display: 'flex', flexDirection: 'column', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1.5rem', borderBottom: `1px solid ${th.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: th.cardBtn }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 Core Team 
                 {club.coreTeam?.length > 0 && <span style={{fontSize: 14, background: 'var(--purple)', color:'white', padding:'2px 8px', borderRadius:20}}>{club.coreTeam.length}</span>}
              </h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {user.id === club._id && (
                  <button 
                    style={{ ...CS.btnSecondary, padding: '0.4rem 0.8rem', fontSize: 14 }}
                    onClick={() => setIsManagingTeam(!isManagingTeam)}
                  >
                    {isManagingTeam ? 'Done Editing' : 'Manage Team'}
                  </button>
                )}
                <button 
                  style={{ background: 'transparent', border: 'none', color: th.muted, cursor: 'pointer', fontSize: 24, lineHeight: 1 }}
                  onClick={() => { setShowTeamModal(false); setIsManagingTeam(false); }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              {isManagingTeam && user.id === club._id && (
                <div style={{ background: th.cardBtn, padding: '1.5rem', borderRadius: 12, border: `1px solid ${th.border}`, marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', marginTop: 0 }}>Add New Member</h4>
                  <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input 
                      type="email" 
                      placeholder="Student Email" 
                      value={newMemberEmail}
                      onChange={e => setNewMemberEmail(e.target.value)}
                      style={{ flex: 1, minWidth: '100%', padding: '0.6rem', borderRadius: 8, border: `1px solid ${th.border}`, background: th.bg, color: th.text }}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Position (e.g. President, Tech Lead)" 
                      value={newMemberTitle}
                      onChange={e => setNewMemberTitle(e.target.value)}
                      style={{ flex: 1, minWidth: '100%', padding: '0.6rem', borderRadius: 8, border: `1px solid ${th.border}`, background: th.bg, color: th.text }}
                      required
                    />
                    <button type="submit" style={{...CS.btnPrimary, width: '100%'}}>Add Member</button>
                  </form>
                </div>
              )}

              {club.coreTeam && club.coreTeam.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1.5rem' }}>
                  {club.coreTeam.map((member, idx) => (
                    <div key={idx} style={{ ...CS.teamCard, position: 'relative', background: th.cardBtn }}>
                      {isManagingTeam && user.id === club._id && (
                        <button 
                          onClick={() => handleRemoveMember(member._id)}
                          style={{ position: 'absolute', top: 5, right: 5, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                          title="Remove Member"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                      {member.userId?.avatar ? (
                        <img src={member.userId.avatar} alt={member.name} style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px auto', display: 'block', border: `2px solid ${th.border}` }} />
                      ) : (
                        <div style={{width: 70, height: 70, borderRadius: '50%', background: th.bg, border: `2px solid ${th.border}`, margin: '0 auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--purple)' }}>{member.name?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                      )}
                      <div style={{ ...CS.teamName, fontSize: '1rem', wordBreak: 'break-word' }}>{member.name}</div>
                      <div style={{ ...CS.teamRole, fontSize: '0.85rem' }}>{member.title}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: th.muted, textAlign: 'center', padding: '2rem 0' }}>No core team members listed.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
