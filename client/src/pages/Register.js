import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Zap, CheckCircle, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';

const INTERESTS = ['Tech', 'Music', 'Sports', 'Culture', 'Business', 'Art', 'Science', 'Social'];
const INTEREST_ICONS = { Tech:'💻', Music:'🎵', Sports:'⚽', Culture:'🎭', Business:'💼', Art:'🎨', Science:'🔬', Social:'🎉' };

export default function Register() {
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'student', interests: [] });
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [sending, setSending]   = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const toggleInterest = (i) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : [...f.interests, i],
    }));
  };

  const startCountdown = () => {
    setCountdown(60);
    const iv = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(iv); return 0; } return c - 1; });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all required fields');
    setSending(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/send-otp`, { email: form.email, name: form.name });
      toast.success(`OTP sent to ${form.email}`);
      setStep(2); startCountdown();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to send OTP'); }
    finally { setSending(false); }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const n = [...otp]; n[idx] = val.slice(-1); setOtp(n);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter all 6 digits');
    setVerifying(true);
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`, { ...form, otp: code });
      login(data.user, data.token);
      toast.success('Account created! 🎉');
      navigate(data.user.role === 'student' ? '/feed' : '/dashboard');
    } catch (err) { toast.error(err.response?.data?.msg || 'Verification failed'); }
    finally { setVerifying(false); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setSending(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/send-otp`, { email: form.email, name: form.name });
      toast.success('New OTP sent!');
      setOtp(['', '', '', '', '', '']); startCountdown();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to resend'); }
    finally { setSending(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.blob1} /><div style={S.blob2} /><div style={S.blob3} />

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logo}><Zap size={22} fill="#fff" color="#fff" /></div>
          <div style={S.logoPulse} />
        </div>

        {/* Step tracker */}
        <div style={S.stepTrack}>
          {[1, 2].map((n, i) => (
            <React.Fragment key={n}>
              <div style={S.stepItem}>
                <div style={{
                  ...S.stepDot,
                  ...(step >= n ? S.stepDotActive : {}),
                  ...(step > n ? S.stepDotDone : {}),
                }}>
                  {step > n ? <CheckCircle size={14} /> : n}
                </div>
                <span style={{ ...S.stepLabel, color: step >= n ? "var(--text)" : "var(--muted)" }}>
                  {n === 1 ? 'Details' : 'Verify'}
                </span>
              </div>
              {i < 1 && (
                <div style={{ ...S.stepLine, background: step >= 2 ? "var(--blue)" : "var(--border)", flex: 1 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <h1 style={S.title}>Create account</h1>
            <p style={S.sub}>Join your campus community</p>

            <form onSubmit={handleSendOTP} style={S.form}>
              {/* Name */}
              <div style={S.field}>
                <label style={S.label}><User size={11} /> Full Name</label>
                <div style={S.inputWrap}>
                  <input placeholder="Alex Johnson" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required style={S.input} />
                </div>
              </div>

              {/* Email */}
              <div style={S.field}>
                <label style={S.label}><Mail size={11} /> College Email</label>
                <div style={S.inputWrap}>
                  <input type="email" placeholder="you@campus.edu" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} required style={S.input} />
                </div>
              </div>

              {/* Password */}
              <div style={S.field}>
                <label style={S.label}><Lock size={11} /> Password</label>
                <div style={S.inputWrap}>
                  <input type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required minLength={6} style={{ ...S.input, paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={S.eyeBtn}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div style={S.field}>
                <label style={S.label}><Sparkles size={11} /> I am a…</label>
                <div style={S.roleRow}>
                  {[['student','Student','🎓'],['organizer','Organizer','📅'],['admin','Faculty','👨‍🏫']].map(([val, label, emoji]) => (
                    <button type="button" key={val}
                      onClick={() => setForm({ ...form, role: val })}
                      style={{ ...S.rolePill, ...(form.role === val ? S.rolePillActive : {}) }}>
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              {form.role === 'student' && (
                <div style={S.field}>
                  <label style={S.label}>✦ Interests <span style={{ color: "var(--muted)", textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                  <div style={S.interestGrid}>
                    {INTERESTS.map(i => (
                      <button type="button" key={i}
                        onClick={() => toggleInterest(i)}
                        style={{ ...S.interestPill, ...(form.interests.includes(i) ? S.interestActive : {}) }}>
                        {INTEREST_ICONS[i]} {i}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" style={{ ...S.btn, opacity: sending ? 0.75 : 1 }} disabled={sending}>
                {sending
                  ? <span style={S.spinnerInline} />
                  : <><span>Send Verification Code</span><ArrowRight size={16} /></>}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={S.mailIcon}>📬</div>
            <h1 style={S.title}>Check your inbox</h1>
            <p style={S.sub}>
              We sent a 6-digit code to<br />
              <strong style={{ color: "var(--blue)" }}>{form.email}</strong>
            </p>

            <div style={S.otpRow}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text" inputMode="numeric" maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  style={{
                    ...S.otpInput,
                    borderColor: digit ? "var(--blue)" : "var(--border)",
                    boxShadow: digit ? '0 0 0 3px rgba(91,141,238,0.15)' : 'none',
                    color: digit ? "var(--text)" : "var(--muted)",
                  }}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying || otp.join('').length < 6}
              style={{ ...S.btn, opacity: (verifying || otp.join('').length < 6) ? 0.55 : 1 }}>
              {verifying
                ? <span style={S.spinnerInline} />
                : <><CheckCircle size={16} /><span>Verify &amp; Create Account</span></>}
            </button>

            <div style={S.resendRow}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Didn't get it?</span>
              <button onClick={handleResend} disabled={countdown > 0 || sending}
                style={{ ...S.resendBtn, opacity: countdown > 0 ? 0.5 : 1 }}>
                {countdown > 0 ? `Resend in ${countdown}s` : sending ? 'Sending…' : 'Resend code'}
              </button>
            </div>

            <button onClick={() => { setStep(1); setOtp(['','','','','','']); }} style={S.backLink}>
              ← Change email or details
            </button>
          </div>
        )}

        <div style={S.footerDivider} />
        <p style={S.footer}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: "var(--blue)", fontWeight: 600 }}>Sign in</Link>
        </p>
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
  blob1: { position: 'fixed', top: '-15%', right: '10%', width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' },
  blob2: { position: 'fixed', bottom: '-10%', left: '0%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, var(--blue-dim) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' },
  blob3: { position: 'fixed', top: '40%', left: '50%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,201,122,0.05) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)' },

  card: {
    background: 'rgba(15,17,23,0.88)',
    border: '1px solid var(--nav-border-scrolled)',
    borderRadius: 22, padding: '44px 40px',
    width: '100%', maxWidth: 460,
    textAlign: 'center',
    backdropFilter: 'blur(24px)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    animation: 'fadeUp 0.5s ease both',
    position: 'relative', zIndex: 1,
  },

  logoWrap: { position: 'relative', width: 56, height: 56, margin: '0 auto 20px' },
  logo: {
    width: 56, height: 56, borderRadius: 14,
    background: 'linear-gradient(135deg, var(--blue), var(--purple))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 28px rgba(91,141,238,0.5)', position: 'relative', zIndex: 1,
  },
  logoPulse: {
    position: 'absolute', inset: -5, borderRadius: 19,
    background: 'linear-gradient(135deg,var(--blue),var(--purple))',
    opacity: 0.12, animation: 'pulse-ring 2.5s ease-out infinite',
  },

  stepTrack: { display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, padding: '0 12px' },
  stepItem:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 },
  stepDot: {
    width: 30, height: 30, borderRadius: '50%',
    background: "var(--bg4)", border: '1.5px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: "var(--muted)",
    transition: 'all 0.3s',
  },
  stepDotActive: { border: '1.5px solid var(--blue)', color: "var(--blue)", background: "var(--blue-dim)" },
  stepDotDone:   { background: "var(--blue)", border: '1.5px solid var(--blue)', color: '#fff' },
  stepLabel:  { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'color 0.3s' },
  stepLine:   { height: 1.5, transition: 'background 0.5s', marginTop: -16, margin: '0 8px 16px' },

  title: { fontFamily: "'DM Serif Display',serif", fontSize: 26, color: "var(--text)", marginBottom: 6 },
  sub:   { color: "var(--muted)", fontSize: 13, marginBottom: 28, lineHeight: 1.7 },

  form: { display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 700, color: "var(--text2)",
    textTransform: 'uppercase', letterSpacing: '0.07em',
  },
  inputWrap: { position: 'relative' },
  input: {
    background: "var(--bg-input)", border: '1.5px solid var(--border)',
    color: "var(--text)", padding: '11px 14px', borderRadius: 10,
    width: '100%', fontSize: 14, transition: 'all 0.2s', outline: 'none',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: "var(--muted)",
    display: 'flex', alignItems: 'center', padding: 4,
  },

  roleRow: { display: 'flex', gap: 8 },
  rolePill: {
    flex: 1, padding: '10px 6px', borderRadius: 10, border: '1.5px solid var(--border)',
    background: "var(--bg-input)", color: "var(--text2)", fontSize: 13, fontWeight: 500,
    transition: 'all 0.2s',
  },
  rolePillActive: {
    border: '1.5px solid var(--blue)', background: "var(--blue-dim)", color: "var(--blue)",
  },

  interestGrid: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  interestPill: {
    padding: '6px 12px', borderRadius: 99, border: '1.5px solid var(--border)',
    background: "var(--bg-input)", color: "var(--text2)", fontSize: 12, fontWeight: 500,
    transition: 'all 0.15s', cursor: 'pointer',
  },
  interestActive: {
    border: '1.5px solid var(--blue)', background: "var(--blue-dim)", color: "var(--blue)",
  },

  btn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'linear-gradient(135deg,var(--blue),var(--blue2))',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '13px', fontSize: 14, fontWeight: 600,
    marginTop: 4, transition: 'all 0.2s',
    boxShadow: '0 4px 20px rgba(91,141,238,0.4)', width: '100%',
  },
  spinnerInline: {
    width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', display: 'block',
  },

  mailIcon: { fontSize: 44, marginBottom: 16 },

  otpRow: { display: 'flex', gap: 10, justifyContent: 'center', margin: '24px 0 20px' },
  otpInput: {
    width: 50, height: 58, textAlign: 'center', fontSize: 24, fontWeight: 700,
    background: "var(--bg-input)", border: '2px solid var(--border)',
    borderRadius: 12, color: "var(--text)", outline: 'none',
    transition: 'all 0.2s', caretColor: "var(--blue)",
  },

  resendRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  resendBtn: { background: 'none', border: 'none', color: "var(--blue)", fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  backLink: {
    display: 'block', background: 'none', border: 'none', color: "var(--muted)",
    fontSize: 13, marginTop: 14, cursor: 'pointer', width: '100%',
  },

  footerDivider: { height: 1, background: "var(--bg3)", margin: '24px 0 20px' },
  footer: { fontSize: 13, color: "var(--muted)" },
};