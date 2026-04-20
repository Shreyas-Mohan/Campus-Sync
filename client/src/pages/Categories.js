import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Compass, Search, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Categories() {
  const { token } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Sample static categories. In a real app, this might come from the backend.
  const categoriesList = [
    { id: 'tech', label: 'Technology & Engineering', icon: '💻', color: '#3b82f6' },
    { id: 'arts', label: 'Arts & Culture', icon: '🎨', color: '#ec4899' },
    { id: 'sports', label: 'Sports & Wellness', icon: '⚽', color: '#10b981' },
    { id: 'academic', label: 'Academic & Professional', icon: '📚', color: '#f59e0b' },
    { id: 'community', label: 'Community Service', icon: '🤝', color: '#8b5cf6' },
    { id: 'other', label: 'Other', icon: '✨', color: '#6b7280' }
  ];

  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/clubs`);
        setClubs(data);
      } catch (err) {
        toast.error('Failed to load clubs');
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, [token]);

  // Filter logic
  const filteredClubs = clubs.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    
    // Fallback: If a club has no category, or it doesn't match predefined strings, maybe map it to "other"
    // Since club schema doesn't strictly have these categories, we will try to match interests/type
    let clubCategory = 'other';
    const cStr = `${c.name} ${c.description} ${c.interests?.join(' ')}`.toLowerCase();
    if (cStr.includes('tech') || cStr.includes('coding') || cStr.includes('computer')) clubCategory = 'tech';
    else if (cStr.includes('art') || cStr.includes('music') || cStr.includes('dance')) clubCategory = 'arts';
    else if (cStr.includes('sport') || cStr.includes('football') || cStr.includes('basketball')) clubCategory = 'sports';
    else if (cStr.includes('academic') || cStr.includes('science') || cStr.includes('math')) clubCategory = 'academic';
    else if (cStr.includes('community') || cStr.includes('social') || cStr.includes('volunteer')) clubCategory = 'community';

    const matchesCategory = selectedCategory ? clubCategory === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar title="Explore Categories" />
      
      <div style={S.container}>
        <div style={S.hero}>
          <h1 style={S.title}><Compass size={32} style={{ color: 'var(--purple)' }} /> Explore Campus</h1>
          <p style={S.subtitle}>Discover clubs and organizations that match your interests.</p>
          
          <div style={S.searchBox}>
            <Search size={20} color="var(--muted)" />
            <input 
              type="text" 
              placeholder="Search by name or keyword..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={S.searchInput}
            />
          </div>
        </div>

        <div style={S.catGrid}>
          <div 
            style={{...S.catCard, background: selectedCategory === null ? 'var(--blue)' : 'var(--bg2)', color: selectedCategory === null ? '#fff' : 'var(--text)'}}
            onClick={() => setSelectedCategory(null)}
          >
            <div style={{ fontSize: 24 }}>🌍</div>
            <h3 style={{...S.catTitle, color: selectedCategory === null ? '#fff' : 'var(--text)'}}>All Groups</h3>
          </div>
          {categoriesList.map(cat => (
            <motion.div 
              key={cat.id} 
              whileHover={{ y: -4, borderColor: cat.color }}
              style={{
                ...S.catCard, 
                borderColor: selectedCategory === cat.id ? cat.color : 'var(--border)',
                background: selectedCategory === cat.id ? `${cat.color}15` : 'var(--bg2)'
              }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <div style={{ fontSize: 24 }}>{cat.icon}</div>
              <h3 style={{...S.catTitle, color: selectedCategory === cat.id ? cat.color : 'var(--text)'}}>{cat.label}</h3>
            </motion.div>
          ))}
        </div>

        <div style={S.resultsMeta}>
          <h2 style={{ fontSize: 20, color: 'var(--text)' }}>
            {selectedCategory ? categoriesList.find(c => c.id === selectedCategory)?.label : 'All Clubs'} 
            <span style={{ color: 'var(--muted)', fontSize: 16, marginLeft: 8 }}>({filteredClubs.length})</span>
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : filteredClubs.length === 0 ? (
          <div style={S.emptyState}>
            <Tag size={40} style={{ color: 'var(--border)', marginBottom: 16 }} />
            <h3>No clubs found</h3>
            <p>Try exploring a different category or search term.</p>
          </div>
        ) : (
          <div style={S.clubGrid}>
            {filteredClubs.map(club => (
              <motion.div key={club._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={S.clubCard}>
                <div style={S.clubBanner}>
                  {club.avatar ? (
                    <img src={club.avatar} alt={club.name} style={S.clubAvatar} />
                  ) : (
                    <div style={{...S.clubAvatar, background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700}}>
                      {club.name[0]}
                    </div>
                  )}
                </div>
                <div style={S.clubInfo}>
                  <h3 style={S.clubName}>{club.name}</h3>
                  <p style={S.clubDesc}>{club.description?.substring(0, 80)}...</p>
                  <Link to={`/club/${club.slug || club._id}`} style={S.viewBtn}>
                    View Profile <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  container: { maxWidth: 1200, margin: '0 auto', padding: '60px 24px' },
  hero: { textAlign: 'center', marginBottom: 40 },
  title: { fontSize: 40, fontFamily: "'DM Serif Display', serif", color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 },
  subtitle: { fontSize: 18, color: 'var(--muted)', marginBottom: 32 },
  searchBox: { display: 'flex', alignItems: 'center', background: 'var(--bg2)', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: 99, maxWidth: 500, margin: '0 auto', gap: 12 },
  searchInput: { flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 16, outline: 'none' },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 40 },
  catCard: { padding: '20px 16px', borderRadius: 16, border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', transition: 'all 0.2s' },
  catTitle: { fontSize: 14, fontWeight: 600 },
  resultsMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' },
  clubGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 },
  clubCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  clubBanner: { height: 80, background: 'linear-gradient(135deg, var(--bg3), var(--border))', position: 'relative' },
  clubAvatar: { width: 64, height: 64, borderRadius: 12, position: 'absolute', bottom: -32, left: 24, border: '4px solid var(--bg2)', objectFit: 'cover' },
  clubInfo: { padding: '40px 24px 24px', display: 'flex', flexDirection: 'column', flex: 1 },
  clubName: { fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 },
  clubDesc: { fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, flex: 1, marginBottom: 20 },
  viewBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--blue)', fontSize: 14, fontWeight: 600, textDecoration: 'none', width: 'fit-content' },
  emptyState: { textAlign: 'center', padding: '60px 24px', color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }
};