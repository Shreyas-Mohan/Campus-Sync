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
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'student' ? '/feed' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      {/* Ambient blobs */}
      <div style={S.blob1} />
      <div style={S.blob2} />

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logo}><Zap size={22} fill="#fff" color="#fff" /></div>
          <div style={S.logoPulse} />
        </div>

        <h1 style={S.title}>Welcome back</h1>
        <p style={S.sub}>Sign in to your CampusSync account</p>

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

        <div style={S.divider}><span style={S.dividerText}>new to campussync?</span></div>

        <Link to="/register" style={S.registerBtn}>
          Create a free account
        </Link>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: "var(--bg)", position: 'relative', overflow: 'hidden', padding: 24,
  },
  blob1: {
    position: 'fixed', top: '-20%', left: '10%',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, var(--blue-dim) 0%, transparent 70%)',
    pointerEvents: 'none', filter: 'blur(40px)',
  },
  blob2: {
    position: 'fixed', bottom: '-10%', right: '5%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
    pointerEvents: 'none', filter: 'blur(40px)',
  },

  card: {
    background: "var(--glass-bg)",
    border: '1px solid var(--nav-border-scrolled)',
    borderRadius: 20,
    padding: '48px 44px',
    width: '100%', maxWidth: 420,
    textAlign: 'center',
    backdropFilter: 'blur(24px)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    animation: 'fadeUp 0.5s ease both',
    position: 'relative', zIndex: 1,
  },

  logoWrap: { position: 'relative', width: 60, height: 60, margin: '0 auto 24px' },
  logo: {
    width: 60, height: 60, borderRadius: 16,
    background: 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto', boxShadow: '0 0 32px rgba(91,141,238,0.5)',
    position: 'relative', zIndex: 1,
  },
  logoPulse: {
    position: 'absolute', inset: -6, borderRadius: 22,
    background: 'linear-gradient(135deg, var(--blue), var(--purple))',
    opacity: 0.15, animation: 'pulse-ring 2.5s ease-out infinite',
  },

  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 30, color: "var(--text)", marginBottom: 6,
  },
  sub: { color: "var(--muted)", fontSize: 14, marginBottom: 32 },

  form: { display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'left' },

  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: {
    display: 'flex', alignItems: 'center',
    fontSize: 12, fontWeight: 600,
    color: "var(--text2)", textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  inputWrap: { position: 'relative' },
  input: {
    background: "var(--bg-input)",
    border: '1.5px solid var(--border)',
    color: "var(--text)", padding: '12px 16px',
    borderRadius: 10, width: '100%', fontSize: 14,
    transition: 'all 0.2s', outline: 'none',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: "var(--muted)",
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
    margin: '24px 0 20px', display: 'flex', alignItems: 'center', gap: 12,
  },
  dividerText: {
    color: "var(--muted)", fontSize: 11, textTransform: 'uppercase',
    letterSpacing: '0.08em', whiteSpace: 'nowrap',
    flex: 1, textAlign: 'center',
    borderTop: '1px solid var(--border)',
    paddingTop: 12, marginTop: -12,
  },

  registerBtn: {
    display: 'block',
    background: "var(--bg-input)",
    border: '1.5px solid var(--border)',
    color: "var(--text2)", borderRadius: 10,
    padding: '12px', fontSize: 14, fontWeight: 500,
    textAlign: 'center', transition: 'all 0.2s',
  },
};