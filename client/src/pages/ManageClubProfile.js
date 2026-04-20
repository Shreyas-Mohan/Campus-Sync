import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, FileText, Link as LinkIcon, Users } from 'lucide-react';
import TeamManagement from '../components/TeamManagement';

export default function ManageClubProfile() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [clubForm, setClubForm] = useState({
    description: '', coverImage: '', logo: '', isRecruiting: false,
    socialLinks: { instagram: '', linkedin: '', website: '' },
  });

  const isClub = user?.role === 'club';

  useEffect(() => {
    const fetchClubProfile = async () => {
      if (!isClub) return;
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/clubs/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClubForm({
          description: data.description || '',
          coverImage: data.coverImage || '',
          logo: data.logo || '',
          isRecruiting: data.isRecruiting || false,
          socialLinks: data.socialLinks || { instagram: '', linkedin: '', website: '' }
        });
      } catch (err) {
        toast.error('Failed to load profile');
      }
    };
    fetchClubProfile();
  }, [isClub, token, user.id]);

  const handleClubSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/clubs/${user.id}`, clubForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Club profile updated successfully!');
      navigate('/dashboard'); // Go back after success
    } catch (err) {
      toast.error(err?.response?.data?.msg || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar title="Manage Club Profile" />

      <div style={S.container}>
        <div style={S.header}>
          <button onClick={() => navigate('/dashboard')} style={S.backBtn}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={S.actions}>
            <button 
              onClick={handleClubSubmit} 
              style={S.publishBtn}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : <><Save size={16} /> Save Profile</>}
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={S.formCard}>
          <h1 style={S.title}>👤 Edit Club Profile</h1>
          <p style={S.subtitle}>Update your campus presence and social links.</p>

          <div style={S.section}>
            <div style={S.sectionLabel}><FileText size={13} /> Basic Information</div>
            <div style={S.field}>
              <textarea placeholder="Club Description" value={clubForm.description}
                onChange={e => setClubForm({...clubForm, description: e.target.value})} rows={4} style={{...S.input, resize: 'vertical'}} />
            </div>

            <div style={S.grid2}>
              <label style={S.fileUploadLabel}>
                <span style={S.fileUploadText}>Cover Image</span>
                <input type="file" accept="image/*"
                   onChange={e => {
                     const file = e.target.files[0];
                     if(file) {
                       const reader = new FileReader();
                       reader.onloadend = () => setClubForm({...clubForm, coverImage: reader.result});
                       reader.readAsDataURL(file);
                     }
                   }} 
                   style={S.fileInput}
                />
              </label>
              <label style={S.fileUploadLabel}>
                <span style={S.fileUploadText}>Logo Image</span>
                <input type="file" accept="image/*"
                   onChange={e => {
                     const file = e.target.files[0];
                     if(file) {
                       const reader = new FileReader();
                       reader.onloadend = () => setClubForm({...clubForm, logo: reader.result});
                       reader.readAsDataURL(file);
                     }
                   }}
                   style={S.fileInput}
                />
              </label>
            </div>
            
            <label style={S.checkboxLabel}>
              <input type="checkbox" checked={clubForm.isRecruiting} 
                onChange={e => setClubForm({...clubForm, isRecruiting: e.target.checked})} 
                style={S.checkbox}
              />
              We are currently recruiting new members!
            </label>
          </div>

          <div style={S.section}>
            <div style={S.sectionLabel}><LinkIcon size={13} /> Social Links</div>
            <div style={S.grid2}>
              <div style={S.field}>
                 <label style={S.label}>Instagram</label>
                 <input placeholder="https://instagram.com/..." value={clubForm.socialLinks.instagram}
                   onChange={e => setClubForm({...clubForm, socialLinks: {...clubForm.socialLinks, instagram: e.target.value}})} style={S.input} />
              </div>
              <div style={S.field}>
                  <label style={S.label}>LinkedIn</label>
                  <input placeholder="https://linkedin.com/..." value={clubForm.socialLinks.linkedin}
                    onChange={e => setClubForm({...clubForm, socialLinks: {...clubForm.socialLinks, linkedin: e.target.value}})} style={S.input} />
              </div>
              <div style={S.field}>
                  <label style={S.label}>Website</label>
                  <input placeholder="https://..." value={clubForm.socialLinks.website}
                    onChange={e => setClubForm({...clubForm, socialLinks: {...clubForm.socialLinks, website: e.target.value}})} style={S.input} />
              </div>
            </div>
          </div>

        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{...S.formCard, marginTop: 24}}>
          <TeamManagement />
        </motion.div>
      </div>
    </div>
  );
}

const S = {
  container: { maxWidth: 900, margin: '0 auto', padding: '100px 24px 60px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 15, fontWeight: 500, transition: '0.2s', },
  actions: { display: 'flex', gap: 12 },
  publishBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #8a2be2, #6b21a8)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(138,43,226,0.3)', },
  formCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px', display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', },
  title: { fontSize: 28, fontFamily: "'DM Serif Display', serif", color: 'var(--text)', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'var(--muted)', marginBottom: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, fontSize: 15, outline: 'none', transition: '0.2s', },
  section: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 10 },
  sectionLabel: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.09em', paddingBottom: 10, borderBottom: '1px solid var(--bg3)', },
  fileUploadLabel: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' },
  fileUploadText: { fontSize: 13, color: 'var(--text2)' },
  fileInput: {
    padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid var(--border)'
  },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text)', marginTop: 8, cursor: 'pointer' },
  checkbox: { width: 16, height: 16, accentColor: 'var(--blue)' }
};