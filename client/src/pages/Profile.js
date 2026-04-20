import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PendingInvites from '../components/PendingInvites';
import {
  User, Mail, Shield, Save, ArrowLeft, Sparkles, CheckCircle2, Lock, Key, Settings, Ticket, HelpCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const ALL_INTERESTS = ['Tech', 'Music', 'Sports', 'Culture', 'Business', 'Art', 'Science', 'Social'];
const ICONS = {
  Tech: '💻', Music: '🎵', Sports: '⚽', Culture: '🎭',
  Business: '💼', Art: '🎨', Science: '🔬', Social: '🎉',
};
const COLORS = {
  Tech: "var(--blue)", Music: "var(--purple)", Sports: "var(--green)", Culture: "var(--orange)",
  Business: '#60a5fa', Art: "var(--pink)", Science: "var(--teal)", Social: '#fbbf24',
};
const ROLE_CFG = {
  student:   { label: 'Student',   color: "var(--green)", bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  icon: '🎓' },
  organizer: { label: 'Organizer', color: "var(--purple)", bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', icon: '📅' },
  club:      { label: 'Club',      color: "var(--purple)", bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', icon: '🏛️' },
  faculty:   { label: 'Faculty',   color: "var(--accent)", bg: 'rgba(232,201,122,0.1)', border: 'rgba(232,201,122,0.25)', icon: '👨‍🏫' },
  admin:     { label: 'Admin',     color: "var(--pink)", bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.25)', icon: '⚡' },
};

export default function Profile() {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();

  const [name,        setName]        = useState(user?.name || '');
  const [interests,   setInterests]   = useState(user?.interests || []);
  const [avatarUrl,   setAvatarUrl]   = useState(user?.avatar || '');
  const [avatarFile,  setAvatarFile]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [changed,     setChanged]     = useState(false);

  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdOtpSent, setPwdOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdOtp, setPwdOtp] = useState('');

  // Password change handlers
  const handleRequestPwdOtp = async () => {
    try {
      setIsChangingPwd(true);
      const { data } = await axios.post(`${API}/auth/send-otp-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(data.msg || 'OTP sent to your email');
      setPwdOtpSent(true);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send OTP');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !pwdOtp) return toast.error('Fill all fields');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      setIsChangingPwd(true);
      const { data } = await axios.post(`${API}/auth/change-password`, {
        otp: pwdOtp,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(data.msg || 'Password updated successfully!');
      setPwdOtpSent(false);
      setNewPassword('');
      setPwdOtp('');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update password');
    } finally {
      setIsChangingPwd(false);
    }
  };

  // Pull fresh profile from server on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${API}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(data.name || '');
        setInterests(data.interests || []);
        setAvatarUrl(data.avatar || '');
      } catch {}
    };
    fetchProfile();
  }, [token]);

  // Track changes
  useEffect(() => {
    const nameChanged      = name.trim() !== (user?.name || '').trim();
    const prevInterests    = (user?.interests || []).slice().sort().join(',');
    const newInterests     = interests.slice().sort().join(',');
    const avatarChanged    = avatarFile !== null;
    setChanged(nameChanged || prevInterests !== newInterests || avatarChanged);
  }, [name, interests, user, avatarFile]);

  const toggleInterest = (item) => {
    setInterests(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name cannot be empty');
    setSaving(true);
    try {
      const { data } = await axios.patch(
        `${API}/auth/profile`,
        { name: name.trim(), interests, avatar: avatarFile },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update AuthContext so Navbar name updates too
      login(data, token);
      toast.success('Profile updated! ✅');
      setChanged(false);
      setAvatarFile(null);
    } catch (e) {
      toast.error(e.response?.data?.msg || 'Failed to save');
    } finally { setSaving(false); }
  };

  const rc = ROLE_CFG[user?.role] || ROLE_CFG.student;

  return (
    <div style={{ minHeight: '100vh', background: "var(--bg)" }}>
      <Navbar title="My Profile" />

      {/* Background blobs */}
      <div style={S.blob1} />
      <div style={S.blob2} />

      <div style={S.container}>
        <PendingInvites />

        {/* ── Back button ── */}
        <button onClick={() => navigate(-1)} style={S.backBtn}>
          <ArrowLeft size={14} /> Back
        </button>

        <div style={S.grid}>

          {/* ── LEFT: Identity card ── */}
          <div style={S.identityCard}>
            {/* Avatar */}
            <div style={S.avatarWrap}>
              <label style={{ cursor: 'pointer', position: 'relative' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatarFile(reader.result);
                        setAvatarUrl(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
                <div style={S.avatarRing}>
                  <div style={{...S.avatar, overflow: 'hidden', padding: 0}}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (user?.name?.[0] || '?').toUpperCase()
                    )}
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--blue)', borderRadius: '50%', padding: '4px', border: '2px solid var(--bg)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={12} />
                </div>
              </label>
              <div style={{ ...S.rolePill, color: rc.color, background: rc.bg, border: `1px solid ${rc.border}`, marginTop: '12px' }}>
                {rc.icon} {rc.label}
              </div>
            </div>

            {/* Info rows */}
            <div style={S.infoBlock}>
              <div style={S.infoRow}>
                <div style={S.infoIcon}><User size={14} color="var(--blue)" /></div>
                <div>
                  <div style={S.infoLabel}>Full Name</div>
                  <div style={S.infoVal}>{user?.name || '—'}</div>
                </div>
              </div>
              <div style={S.infoRow}>
                <div style={S.infoIcon}><Mail size={14} color="var(--purple)" /></div>
                <div>
                  <div style={S.infoLabel}>Email</div>
                  <div style={S.infoVal}>{user?.email || '—'}</div>
                </div>
              </div>
              <div style={S.infoRow}>
                <div style={S.infoIcon}><Shield size={14} color="var(--green)" /></div>
                <div>
                  <div style={S.infoLabel}>Account Role</div>
                  <div style={{ ...S.infoVal, color: rc.color }}>{rc.label}</div>
                </div>
              </div>
            </div>

            {/* Interest summary */}
            {interests.length > 0 && (
              <div style={S.interestSummary}>
                <div style={S.summaryLabel}>
                  <Sparkles size={12} color="var(--accent)" />
                  <span>{interests.length} interest{interests.length !== 1 ? 's' : ''} selected</span>
                </div>
                <div style={S.summaryPills}>
                  {interests.map(i => (
                    <span key={i} style={{ ...S.summaryPill, color: COLORS[i], background: `${COLORS[i]}18`, border: `1px solid ${COLORS[i]}44` }}>
                      {ICONS[i]} {i}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Quick Links */}
            <div style={S.editCard}>
              <h2 style={S.cardTitle}>Quick Links</h2>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                <button onClick={() => navigate('/settings')} style={S.actionBtn}>
                  <Settings size={16} /> App Settings
                </button>
                {user?.role === 'student' && (
                  <button onClick={() => navigate('/rsvps')} style={S.actionBtn}>
                    <Ticket size={16} /> My RSVPs
                  </button>
                )}
              </div>
            </div>
          
            {/* Edit details */}
            <div style={S.editCard}>
              <h2 style={S.cardTitle}>Edit Profile</h2>
              <p style={S.cardSub}>Update your name and event preferences</p>

            {/* Name field */}
            <div style={S.field}>
              <label style={S.fieldLabel}><User size={11} /> Display Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={S.input}
                placeholder="Your full name"
              />
            </div>

            {/* Interests — only for students */}
            {user?.role === 'student' && (
              <div style={S.field}>
                <label style={S.fieldLabel}>
                  <Sparkles size={11} /> Event Interests
                  <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>
                    — tap to toggle
                  </span>
                </label>
                <div style={S.interestGrid}>
                  {ALL_INTERESTS.map(item => {
                    const selected = interests.includes(item);
                    const c = COLORS[item];
                    return (
                      <button
                        key={item}
                        onClick={() => toggleInterest(item)}
                        style={{
                          ...S.interestBtn,
                          ...(selected ? {
                            background: `${c}18`,
                            border: `2px solid ${c}`,
                            color: c,
                            boxShadow: `0 0 12px ${c}22`,
                            transform: 'scale(1.04)',
                          } : {}),
                        }}
                      >
                        <span style={S.interestIcon}>{ICONS[item]}</span>
                        <span style={S.interestLabel}>{item}</span>
                        {selected && (
                          <CheckCircle2 size={13} color={c} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p style={S.hint}>
                  {interests.length === 0
                    ? 'No interests selected — tap any category to add'
                    : `${interests.length} of ${ALL_INTERESTS.length} selected`}
                </p>
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!changed || saving}
              style={{
                ...S.saveBtn,
                opacity: (!changed || saving) ? 0.5 : 1,
                cursor: (!changed || saving) ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? (
                <><span style={S.spinner} /> Saving…</>
              ) : (
                <><Save size={15} /> {changed ? 'Save Changes' : 'No Changes'}</>
              )}
            </button>
            </div>

            {/* Change Password Card */}
            <div style={S.editCard}>
              <h2 style={S.cardTitle}>Security</h2>
              <p style={S.cardSub}>Update your account password</p>

              {!pwdOtpSent ? (
                <button
                  onClick={handleRequestPwdOtp}
                  disabled={isChangingPwd}
                  style={{
                    ...S.saveBtn,
                    background: 'var(--bg4)',
                    color: 'var(--text)',
                    boxShadow: 'none',
                    border: '1px solid var(--border)',
                    opacity: isChangingPwd ? 0.5 : 1,
                    marginTop: 0,
                  }}
                >
                  {isChangingPwd ? 'Sending OTP…' : <><Mail size={15} /> Request OTP to Change Password</>}
                </button>
              ) : (
                <>
                  <div style={S.field}>
                    <label style={S.fieldLabel}><Key size={11} /> Enter OTP</label>
                    <input
                      type="text"
                      value={pwdOtp}
                      onChange={e => setPwdOtp(e.target.value)}
                      style={S.input}
                      placeholder="6-digit code from email"
                    />
                  </div>
                  <div style={S.field}>
                    <label style={S.fieldLabel}><Lock size={11} /> New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={S.input}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPwd || !newPassword || !pwdOtp}
                    style={{
                      ...S.saveBtn,
                      opacity: (isChangingPwd || !newPassword || !pwdOtp) ? 0.5 : 1,
                    }}
                  >
                    {isChangingPwd ? <><span style={S.spinner} /> Updating…</> : <><Shield size={15} /> Update Password</>}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  blob1: {
    position: 'fixed', top: '-10%', right: '5%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(91,141,238,0.07) 0%, transparent 70%)',
    pointerEvents: 'none', filter: 'blur(40px)',
  },
  blob2: {
    position: 'fixed', bottom: '-5%', left: '0%',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)',
    pointerEvents: 'none', filter: 'blur(40px)',
  },

  container: { maxWidth: 1000, margin: '0 auto', padding: '32px 28px 80px', position: 'relative' },

  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: "var(--blue-dim)", border: '1px solid rgba(91,141,238,0.2)',
    color: "var(--blue)", borderRadius: 10, padding: '8px 16px',
    fontSize: 13, fontWeight: 600, marginBottom: 28, cursor: 'pointer',
    transition: 'all 0.2s',
  },

  grid: {
    display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start',
  },

  // Identity card
  identityCard: {
    background: "var(--bg2)", border: '1px solid var(--bg4)', borderRadius: 18,
    padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20,
    position: 'sticky', top: 84,
  },
  avatarWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 },
  avatarRing: {
    width: 88, height: 88, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--blue), var(--purple))',
    padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 28px var(--blue-border)',
  },
  avatar: {
    width: '100%', height: '100%', borderRadius: '50%',
    background: "var(--bg2)",
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 32, fontWeight: 800,
    background: 'linear-gradient(135deg, var(--blue)22, var(--purple)22)',
    color: "var(--text)",
  },
  rolePill: {
    fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 99,
  },
  infoBlock: { display: 'flex', flexDirection: 'column', gap: 14 },
  infoRow: {
    display: 'flex', gap: 12, alignItems: 'flex-start',
    background: "var(--bg)", borderRadius: 10, padding: '12px 14px',
    border: '1px solid var(--bg3)',
  },
  infoIcon: {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    background: "var(--bg2)", border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 },
  infoVal:   { fontSize: 14, color: "var(--text)", fontWeight: 500 },
  interestSummary: {
    background: 'rgba(232,201,122,0.05)', border: '1px solid rgba(232,201,122,0.15)',
    borderRadius: 12, padding: '14px',
  },
  summaryLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: 10,
  },
  summaryPills: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  summaryPill: {
    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
  },

  // Edit card
  editCard: {
    background: "var(--bg2)", border: '1px solid var(--bg4)', borderRadius: 18,
    padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 24,
  },
  cardTitle: { fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "var(--text)", margin: 0 },
  cardSub:   { fontSize: 14, color: "var(--muted)", margin: 0 },

  field: { display: 'flex', flexDirection: 'column', gap: 10 },
  fieldLabel: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 700, color: "var(--text2)",
    textTransform: 'uppercase', letterSpacing: '0.07em',
  },
  input: {
    background: "var(--bg)", border: '1.5px solid var(--border)',
    color: "var(--text)", padding: '12px 16px', borderRadius: 10,
    fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
    width: '100%', boxSizing: 'border-box',
  },

  interestGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10,
  },
  interestBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: "var(--bg)", border: '2px solid var(--border)',
    color: "var(--muted)", borderRadius: 12, padding: '10px 14px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.18s ease', textAlign: 'left',
  },
  interestIcon: { fontSize: 16, flexShrink: 0 },
  interestLabel: { flex: 1 },
  hint: { fontSize: 12, color: "var(--faint)", margin: 0 },

  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
    flex: '1 1 auto', justifyContent: 'center'
  },

  saveBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'linear-gradient(135deg,var(--blue),var(--blue2))',
    color: '#fff', border: 'none', borderRadius: 12,
    padding: '13px 28px', fontSize: 14, fontWeight: 700,
    transition: 'all 0.2s', boxShadow: '0 4px 20px var(--blue-border)',
    marginTop: 4,
  },
  spinner: {
    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', display: 'block',
  },
};
