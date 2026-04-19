import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetStage, setResetStage] = useState(false);
  const [resetForm, setResetForm] = useState({ email: '', otp: '', newPassword: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!resetForm.email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, { email: resetForm.email });
      toast.success(data.msg);
      setResetStage(true);
    } catch(err) {
      toast.error(err.response?.data?.msg || 'Request failed');
    } finally { setLoading(false); }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/reset-password`, resetForm);
      toast.success(data.msg);
      setForgotMode(false); setResetStage(false); setResetForm({ email: '', otp: '', newPassword: '' });
    } catch(err) {
      toast.error(err.response?.data?.msg || 'Reset failed');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'student' ? '/feed' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      {/* Background Overlay for blur and darkening */}
      <div style={S.overlay} />

      <div style={S.card}>
        {/* Brand Logo & Title */}
        <div style={S.brandWrap}>
          <div style={S.logoWrap}>
            <div style={S.logo}><Zap size={24} fill="#fff" color="#fff" /></div>
            <div style={S.logoPulse} />
          </div>
          <h1 style={S.brandTitle}>CampusSync</h1>
          {/* Your Full Project Title */}
          <p style={S.matrixSubtitle}>Unified College Club & Event Matrix</p>
        </div>

        <h2 style={S.title}>{forgotMode ? (resetStage ? 'Reset Password' : 'Forgot Password') : 'Member Login'}</h2>
        <p style={S.sub}>{forgotMode ? 'Recover your access' : 'Sign in to your account'}</p>

        {forgotMode ? (
          resetStage ? (
            <form onSubmit={handleResetSubmit} style={S.form}>
              <div style={S.field}>
                <label style={S.label}><Mail size={12} style={{ marginRight: 5 }} /> Email</label>
                <div style={S.inputWrap}>
                  <input type="email" value={resetForm.email} readOnly style={S.input} />
                </div>
              </div>
              <div style={S.field}>
                <label style={S.label}><Lock size={12} style={{ marginRight: 5 }} /> OTP</label>
                <div style={S.inputWrap}>
                  <input type="text" placeholder="123456" value={resetForm.otp} onChange={e => setResetForm({ ...resetForm, otp: e.target.value })} required style={S.input} />
                </div>
              </div>
              <div style={S.field}>
                <label style={S.label}><Lock size={12} style={{ marginRight: 5 }} /> New Password</label>
                <div style={S.inputWrap}>
                  <input type="password" placeholder="••••••••" value={resetForm.newPassword} onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })} required style={S.input} />
                </div>
              </div>
              <button type="submit" style={{ ...S.btn, opacity: loading ? 0.75 : 1 }} disabled={loading}>
                {loading ? <span style={S.spinnerInline} /> : <><span>Update Password</span><ArrowRight size={16} /></>}
              </button>
              <div style={S.footer}>
                <span onClick={() => {setForgotMode(false); setResetStage(false);}} style={{...S.link, cursor: 'pointer'}}>Back to Login</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotSubmit} style={S.form}>
              <div style={S.field}>
                <label style={S.label}><Mail size={12} style={{ marginRight: 5 }} /> Verification Email</label>
                <div style={S.inputWrap}>
                  <input type="email" placeholder="you@campus.edu" value={resetForm.email} onChange={e => setResetForm({ ...resetForm, email: e.target.value })} required style={S.input} />
                </div>
              </div>
              <button type="submit" style={{ ...S.btn, opacity: loading ? 0.75 : 1 }} disabled={loading}>
                {loading ? <span style={S.spinnerInline} /> : <><span>Send OTP</span><ArrowRight size={16} /></>}
              </button>
              <div style={S.footer}>
                <span onClick={() => setForgotMode(false)} style={{...S.link, cursor: 'pointer'}}>Back to Login</span>
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handleSubmit} style={S.form}>
            {/* Email */}
            <div style={S.field}>
              <label style={S.label}>
                <Mail size={12} style={{ marginRight: 5 }} /> Email
              </label>
              <div style={S.inputWrap}>
                <input
                  type="email"
                  placeholder="you@campus.edu"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  style={S.input}
                />
              </div>
            </div>

            {/* Password */}
            <div style={S.field}>
              <label style={S.label}>
                <Lock size={12} style={{ marginRight: 5 }} /> Password
              </label>
              <div style={S.inputWrap}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ ...S.input, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={S.eyeBtn}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            
            <div style={{ textAlign: 'right', marginTop: '-12px', marginBottom: '24px' }}>
              <span onClick={() => setForgotMode(true)} style={{...S.link, fontSize: 13, cursor: 'pointer'}}>Forgot Password?</span>
            </div>

            <button
              type="submit"
              style={{ ...S.btn, opacity: loading ? 0.75 : 1 }}
              disabled={loading}
            >
              {loading ? (
                <span style={S.spinnerInline} />
              ) : (
                <><span>Sign In</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>
        )}

        {!forgotMode && (
          <>
            <div style={S.divider}><span style={S.dividerText}>new to campussync?</span></div>

            <Link to="/register" style={S.registerBtn}>
              Create a free account
            </Link>
          </>
        )}
      </div>

      {/* Decorative Matrix Footer */}
      <div style={S.pageFooter}>
        <span style={S.footerClaim}>Discovery</span>
        <span style={S.footerClaim}>Engagement</span>
        <span style={S.footerClaim}>Coordination</span>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    // Add your institute picture from the public folder
    backgroundImage: `url('/IMG-20240905-WA0003.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.45)', // Darkens the image slightly
    backdropFilter: 'blur(8px)',       // Creates the blurred background effect
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 0,
  },
  card: {
    // Glassmorphism Effect
    background: 'rgba(25, 25, 25, 0.65)', 
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    width: '100%',
    maxWidth: 420,
    padding: '40px 32px',
    borderRadius: 24,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1, // Sit above the background overlay
  },

  brandWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    color: '#fff',
    marginTop: 14,
    letterSpacing: 1,
  },
  logoWrap: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: '16px',
    background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(var(--primary-rgb), 0.5)',
    zIndex: 1,
  },
  logo: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
  },
  logoPulse: {
    position: 'absolute',
    inset: -4,
    borderRadius: '20px',
    background: 'var(--primary)',
    opacity: 0.3,
    filter: 'blur(8px)',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  sub: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 32, textAlign: 'center' },

  form: { display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'left' },

  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: {
    display: 'flex', alignItems: 'center',
    fontSize: 12, fontWeight: 600,
    color: "#e2e8f0", textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  inputWrap: { position: 'relative' },
  input: {
    background: "rgba(255, 255, 255, 0.1)",
    border: '1.5px solid rgba(255, 255, 255, 0.2)',
    color: "#fff", padding: '12px 16px',
    borderRadius: 10, width: '100%', fontSize: 14,
    transition: 'all 0.2s', outline: 'none',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: "rgba(255,255,255,0.7)",
    display: 'flex', alignItems: 'center', padding: 4,
    transition: 'color 0.2s',
  },

  btn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'linear-gradient(135deg,var(--blue) 0%,var(--blue2) 100%)',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '13px', fontSize: 15, fontWeight: 600,
    marginTop: 6, transition: 'all 0.2s',
    boxShadow: '0 4px 20px rgba(91,141,238,0.4)',
  },
  spinnerInline: {
    width: 20, height: 20,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', display: 'block',
  },

  divider: {
    margin: '24px 0 20px', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.6
  },
  dividerText: {
    color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: 'uppercase',
    letterSpacing: '0.08em', whiteSpace: 'nowrap',
    flex: 1, textAlign: 'center',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: 12, marginTop: -12,
  },

  registerBtn: {
    display: 'block',
    background: "rgba(255, 255, 255, 0.05)",
    border: '1.5px solid rgba(255, 255, 255, 0.1)',
    color: "#fff", borderRadius: 10,
    padding: '12px', fontSize: 14, fontWeight: 500,
    textAlign: 'center', transition: 'all 0.2s', textDecoration: 'none'
  },
  // Add a subtle bottom-page footer for extra "Matrix" feel
  pageFooter: {
    position: 'absolute',
    bottom: 30,
    display: 'flex',
    gap: 40,
    zIndex: 1,
    opacity: 0.5,
  },
  footerClaim: {
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    fontWeight: 500,
  }
};