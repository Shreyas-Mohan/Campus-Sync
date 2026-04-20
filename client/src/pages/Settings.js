import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Bell, Lock, User, Palette, ChevronRight, Shield, HelpCircle } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('account');
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    // Simulate save
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings saved successfully');
    }, 800);
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: <User size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Lock size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'support', label: 'Help & Support', icon: <HelpCircle size={18} /> }
  ];

  const handleTabChange = (id) => {
    if (id === 'support') {
      navigate('/support');
    } else {
      setActiveTab(id);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar title="Settings" />
      
      <div style={S.container}>
        <div style={S.header}>
          <h1 style={S.title}><SettingsIcon size={28} /> Settings</h1>
          <p style={S.subtitle}>Manage your account preferences and personal information.</p>
        </div>

        <div style={S.layout}>
          {/* Sidebar */}
          <div style={S.sidebar}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                style={{
                  ...S.tabBtn,
                  background: activeTab === tab.id ? 'var(--bg2)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--blue)' : 'var(--text)',
                  fontWeight: activeTab === tab.id ? 600 : 500
                }}
                onClick={() => handleTabChange(tab.id)}
              >
                <div style={S.tabContent}>
                  {tab.icon} {tab.label}
                </div>
                {activeTab === tab.id && <ChevronRight size={16} />}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div style={S.content}>
            <AnimateContent activeTab={activeTab}>
              {activeTab === 'account' && (
                <div style={S.section}>
                  <h2 style={S.sectionTitle}>Account Details</h2>
                  <div style={S.field}>
                    <label style={S.label}>Full Name</label>
                    <input style={S.input} defaultValue={user?.name} disabled />
                    <p style={S.helpText}>To change your name, please contact support.</p>
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Email Address</label>
                    <input style={S.input} defaultValue={user?.email} disabled />
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Role</label>
                    <input style={{...S.input, textTransform: 'capitalize'}} defaultValue={user?.role} disabled />
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div style={S.section}>
                  <h2 style={S.sectionTitle}>Notification Preferences</h2>
                  <div style={S.toggleRow}>
                    <div>
                      <h4 style={S.toggleTitle}>Email Notifications</h4>
                      <p style={S.helpText}>Receive updates about RSVPs and messages via email.</p>
                    </div>
                    <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
                  </div>
                  <div style={S.divider} />
                  <div style={S.toggleRow}>
                    <div>
                      <h4 style={S.toggleTitle}>Push Notifications</h4>
                      <p style={S.helpText}>Enable in-app notifications for immediate updates.</p>
                    </div>
                    <Toggle checked={pushNotifs} onChange={setPushNotifs} />
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div style={S.section}>
                  <h2 style={S.sectionTitle}>Privacy & Security</h2>
                  
                  <div style={S.toggleRow}>
                    <div>
                      <h4 style={{ ...S.toggleTitle, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Shield size={16} color="var(--purple)" /> Private Profile
                      </h4>
                      <p style={S.helpText}>Only approved clubs can see your RSVP history and interests.</p>
                    </div>
                    <Toggle checked={profilePrivate} onChange={setProfilePrivate} />
                  </div>

                  <div style={S.divider} />

                  <div style={S.dangerZone}>
                    <h4 style={{...S.toggleTitle, color: 'var(--red)'}}>Danger Zone</h4>
                    <p style={S.helpText}>Permanently delete your account and all associated data.</p>
                    <button style={S.dangerBtn} onClick={() => alert('Please contact an administrator to delete your account.')}>
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div style={S.section}>
                  <h2 style={S.sectionTitle}>Appearance</h2>
                  <div style={S.themeContainer}>
                    <div 
                      onClick={() => theme !== 'light' && toggleTheme()}
                      style={{
                        ...S.themeCard, 
                        borderColor: theme === 'light' ? 'var(--blue)' : 'var(--border)',
                        background: '#f9fafb'
                      }}
                    >
                      <SunIcon color="#374151" />
                      <span style={{ color: '#374151', fontWeight: 500, marginTop: 8 }}>Light Mode</span>
                    </div>
                    <div 
                      onClick={() => theme !== 'dark' && toggleTheme()}
                      style={{
                        ...S.themeCard, 
                        borderColor: theme === 'dark' ? 'var(--blue)' : 'var(--border)',
                        background: '#111827'
                      }}
                    >
                      <MoonIcon color="#f3f4f6" />
                      <span style={{ color: '#f3f4f6', fontWeight: 500, marginTop: 8 }}>Dark Mode</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={S.footer}>
                <button 
                  onClick={handleSave} 
                  disabled={loading}
                  style={S.saveBtn}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </AnimateContent>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
const AnimateContent = ({ children, activeTab }) => (
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

const Toggle = ({ checked, onChange }) => (
  <div 
    onClick={() => onChange(!checked)}
    style={{
      width: 44, height: 24, borderRadius: 99,
      background: checked ? 'var(--blue)' : 'var(--muted)',
      position: 'relative', cursor: 'pointer', transition: '0.2s',
      flexShrink: 0
    }}
  >
    <div style={{
      width: 20, height: 20, borderRadius: '50%', background: '#fff',
      position: 'absolute', top: 2, left: checked ? 22 : 2,
      transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
    }} />
  </div>
);

const SunIcon = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);

const MoonIcon = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);

const S = {
  container: { maxWidth: 1000, margin: '0 auto', padding: '60px 24px' },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontFamily: "'DM Serif Display', serif", color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'var(--muted)' },
  layout: { display: 'flex', gap: 32, flexWrap: 'wrap' },
  sidebar: { width: 250, display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 },
  tabBtn: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 15, transition: '0.2s', textAlign: 'left' },
  tabContent: { display: 'flex', alignItems: 'center', gap: 12 },
  content: { flex: 1, minWidth: 300, background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border)', padding: '32px' },
  section: { display: 'flex', flexDirection: 'column', gap: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 8 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 8, fontSize: 15, cursor: 'not-allowed' },
  helpText: { fontSize: 13, color: 'var(--muted)', marginTop: 2 },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  toggleTitle: { fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 4 },
  divider: { height: 1, background: 'var(--border)', margin: '12px 0' },
  dangerZone: { marginTop: 16 },
  dangerBtn: { padding: '8px 16px', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontWeight: 600, marginTop: 12, cursor: 'pointer' },
  themeContainer: { display: 'flex', gap: 16 },
  themeCard: { width: 120, height: 100, borderRadius: 12, border: '2px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' },
  footer: { marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' },
  saveBtn: { padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', transition: '0.2s' }
};