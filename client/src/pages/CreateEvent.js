import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Send, Image as ImageIcon, CheckCircle, Tag, Calendar, MapPin, Users, Link as LinkIcon, FileText } from 'lucide-react';

const CATS = ['Tech','Music','Sports','Culture','Business','Art','Science','Social'];

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });

export default function CreateEvent() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null;

  const [form, setForm] = useState(editData || {
    title: '', description: '', detailedDescription: '', category: 'Tech',
    date: '', venue: '', tags: '', maxCapacity: '',
    poster: '', applicationLink: '',
    eventHead1: { name: '', rollNo: '', contact: '' },
    eventHead2: { name: '', rollNo: '', contact: '' },
    status: 'draft' // defaults to saving as draft
  });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editData) {
      if (token && user?.role === 'club') {
        axios.get('http://localhost:5000/api/events/draft', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          if (res.data) {
            setForm(res.data);
            toast('Draft restored', { icon: '📝' });
          }
        }).catch(err => {
          console.log('No draft found on server');
        });
      }
    }
  }, [editData, token, user]);

  useEffect(() => {
    if (!editData && form.title) {
      if (token && user?.role === 'club') {
        const timeout = setTimeout(() => {
          axios.post('http://localhost:5000/api/events/draft', form, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(err => console.log('Draft save failed'));
        }, 3000);
        return () => clearTimeout(timeout);
      }
    }
  }, [form, editData, token, user]);

  const handlePosterChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setForm(f => ({ ...f, poster: base64 }));
    } catch { toast.error('Failed to read image'); }
  };

  const handleAction = async (status) => {
    if (!form.title || !form.date || !form.venue) {
      return toast.error("Title, Date, and Venue are required");
    }

    setSubmitting(true);
    try {
      const payload = { ...form, status };
      if (typeof payload.tags === 'string') {
        payload.tags = payload.tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      if (editData?._id) {
        await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${editData._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Event ${status === 'draft' ? 'draft updated' : 'submitted for approval'}`);
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Event ${status === 'draft' ? 'saved as draft' : 'submitted for approval'}`);
        if (status !== 'draft') {
          axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/draft`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {});
        }
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error saving event');
    } finally {
      setSubmitting(false);
    }
  };

  const setHead = (head, field, val) => {
    setForm(f => ({ ...f, [head]: { ...f[head], [field]: val } }));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar title={editData ? "Edit Event" : "Create Event"} />

      <div style={S.container}>
        <div style={S.header}>
          <button onClick={() => navigate('/dashboard')} style={S.backBtn}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={S.actions}>
            {form.status !== 'approved' && (
              <button 
                onClick={() => handleAction('draft')} 
                style={S.draftBtn}
                disabled={submitting}
              >
                {submitting ? '...' : <><Save size={16} /> Save as Draft</>}
              </button>
            )}
            <button 
              onClick={() => handleAction('pending')} 
              style={S.publishBtn}
              disabled={submitting}
            >
              {submitting ? '...' : <><Send size={16} /> Submit for Approval</>}
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={S.formCard}>
          <h1 style={S.title}>{editData ? 'Edit Event Details' : 'Design New Event'}</h1>
          <p style={S.subtitle}>Fill in the required information. Drafts are auto-saved locally.</p>

          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}><FileText size={14}/> Event Title *</label>
              <input 
                placeholder="E.g., Autumn Tech Fest" 
                value={form.title} onChange={e => setForm({...form, title: e.target.value})} 
                style={S.input} 
              />
            </div>
            
            <div style={S.field}>
              <label style={S.label}><Tag size={14}/> Category</label>
              <select 
                value={form.category} onChange={e => setForm({...form, category: e.target.value})} 
                style={S.input}
              >
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}><Calendar size={14}/> Date & Time *</label>
              <input 
                type="datetime-local" 
                value={form.date ? new Date(new Date(form.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                onChange={e => setForm({...form, date: new Date(e.target.value).toISOString()})} 
                style={S.input} 
              />
            </div>
            
            <div style={S.field}>
              <label style={S.label}><MapPin size={14}/> Venue *</label>
              <input 
                placeholder="Auditorium" 
                value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} 
                style={S.input} 
              />
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Short Description</label>
            <input 
              maxLength={100} placeholder="A quick one-liner about the event..." 
              value={form.description} onChange={e => setForm({...form, description: e.target.value})} 
              style={S.input} 
            />
          </div>

          <div style={S.field}>
            <label style={S.label}>Detailed Description (Markdown Supported)</label>
            <textarea 
              rows={5} placeholder="Full event schedule, prizes, etc..." 
              value={form.detailedDescription} onChange={e => setForm({...form, detailedDescription: e.target.value})} 
              style={{...S.input, resize: 'vertical'}} 
            />
          </div>

          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}><LinkIcon size={14}/> Registration Link (Optional)</label>
              <input 
                type="url" placeholder="https://..." 
                value={form.applicationLink} onChange={e => setForm({...form, applicationLink: e.target.value})} 
                style={S.input} 
              />
            </div>
            <div style={S.field}>
              <label style={S.label}><Users size={14}/> Max Capacity</label>
              <input 
                type="number" placeholder="Leave empty for unlimited" 
                value={form.maxCapacity} onChange={e => setForm({...form, maxCapacity: e.target.value})} 
                style={S.input} 
              />
            </div>
          </div>

          {/* Event Heads */}
          <div style={S.coordinatorsBox}>
            <h3 style={S.coordTitle}>Event Coordinators</h3>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={S.label}>Head 1</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input placeholder="Name" value={form.eventHead1.name} onChange={e => setHead('eventHead1', 'name', e.target.value)} style={S.input}/>
                  <input placeholder="Roll No" value={form.eventHead1.rollNo} onChange={e => setHead('eventHead1', 'rollNo', e.target.value)} style={S.input}/>
                  <input placeholder="Contact" value={form.eventHead1.contact} onChange={e => setHead('eventHead1', 'contact', e.target.value)} style={S.input}/>
                </div>
              </div>
              <div>
                <label style={S.label}>Head 2 (Optional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input placeholder="Name" value={form.eventHead2.name} onChange={e => setHead('eventHead2', 'name', e.target.value)} style={S.input}/>
                  <input placeholder="Roll No" value={form.eventHead2.rollNo} onChange={e => setHead('eventHead2', 'rollNo', e.target.value)} style={S.input}/>
                  <input placeholder="Contact" value={form.eventHead2.contact} onChange={e => setHead('eventHead2', 'contact', e.target.value)} style={S.input}/>
                </div>
              </div>
            </div>
          </div>

          {/* Poster Upload */}
          <div style={S.field}>
            <label style={S.label}><ImageIcon size={14}/> Event Poster</label>
            <label style={S.posterZone}>
              <input type="file" accept="image/*" onChange={handlePosterChange} style={{ display: 'none' }} />
              {form.poster ? (
                <img src={form.poster} alt="Preview" style={S.posterPreview} />
              ) : (
                <div style={S.uploadPlaceholder}>
                  <ImageIcon size={32} color="var(--purple)" style={{ marginBottom: 12 }} />
                  <p style={{ color: 'var(--text)' }}>Click to upload poster</p>
                  <p style={{ color: 'var(--muted)', fontSize: 12 }}>Recommended: 1080x1080 (1:1 ratio)</p>
                </div>
              )}
            </label>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

const S = {
  container: {
    maxWidth: 900, margin: '0 auto', padding: '100px 24px 60px'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24
  },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 15, fontWeight: 500, transition: '0.2s',
  },
  actions: {
    display: 'flex', gap: 12
  },
  draftBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)',
    padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: '0.2s',
  },
  publishBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'linear-gradient(135deg, #8a2be2, #6b21a8)', border: 'none', color: '#fff',
    padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: '0.2s',
    boxShadow: '0 4px 15px rgba(138,43,226,0.3)',
  },
  formCard: {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px',
    display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  title: { fontSize: 28, fontFamily: "'DM Serif Display', serif", color: 'var(--text)', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'var(--muted)', marginBottom: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: 8, fontSize: 15, outline: 'none', transition: '0.2s',
  },
  coordinatorsBox: {
    padding: '24px', background: 'rgba(138,43,226, 0.03)', border: '1px dashed rgba(138,43,226, 0.3)', borderRadius: 12,
  },
  coordTitle: { fontSize: 16, color: 'var(--purple)', fontWeight: 600, marginBottom: 16 },
  posterZone: {
    display: 'block', width: '100%', minHeight: 250, border: '2px dashed var(--border)', 
    borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: 'var(--bg-input)',
    transition: '0.2s', position: 'relative',
  },
  uploadPlaceholder: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 250,
  },
  posterPreview: {
    width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block'
  }
};