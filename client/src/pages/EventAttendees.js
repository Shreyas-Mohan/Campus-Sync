import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import { ArrowLeft, Users, Download, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventAttendees() {
  const { eventId } = useParams();
  const { token, user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [rsvps, setRsvps] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendees();
  }, [eventId, token]);

  const fetchAttendees = async () => {
    try {
      // First get event details
      const evRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${eventId}`);
      setEventData(evRes.data);

      const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/rsvp/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRsvps(res.data);
    } catch (err) {
      toast.error('Failed to load attendees');
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckIn = async (rsvpId) => {
    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/rsvp/${rsvpId}/checkin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRsvps(prev => prev.map(r => r._id === rsvpId ? { ...r, checkedIn: res.data.checkedIn } : r));
      toast.success('Check-in status updated');
    } catch (err) {
      toast.error('Failed to update check-in');
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Roll Number', 'Checked In'];
    const rows = rsvps.map(r => [
      r.user?.name || 'N/A',
      r.user?.email || 'N/A',
      r.user?.rollNumber || 'N/A',
      r.checkedIn ? 'Yes' : 'No'
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${eventData?.title || 'event'}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const S = {
    container: { maxWidth: 1000, margin: '80px auto 40px', padding: '0 20px', color: 'var(--text)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
    titleBox: { display: 'flex', alignItems: 'center', gap: 12 },
    backBtn: { background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 },
    title: { fontSize: 24, fontWeight: 700, margin: 0 },
    subtitle: { color: 'var(--muted)', fontSize: 14, marginTop: 4 },
    controls: { display: 'flex', gap: 12, alignItems: 'center' },
    exportBtn: {
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
      background: 'linear-gradient(135deg, var(--blue), var(--blue2))',
      color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
    },
    table: { width: '100%', borderCollapse: 'collapse', background: 'var(--bg2)', borderRadius: 12, overflow: 'hidden' },
    th: { textAlign: 'left', padding: '16px', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600 },
    td: { padding: '16px', borderBottom: '1px solid var(--border)' },
    checkBtn: { 
      background: 'transparent', border: 'none', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
      borderRadius: 20, fontSize: 13, fontWeight: 600
    },
    empty: { textAlign: 'center', padding: 60, color: 'var(--muted)' }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar title="Event Attendees" />
      <div style={S.container}>
        <div style={S.header}>
          <div>
            <button onClick={() => navigate(-1)} style={S.backBtn}><ArrowLeft size={18} /> Back</button>
            <h1 style={S.title}>{eventData ? eventData.title : 'Loading...'}</h1>
            <p style={S.subtitle}><Users size={14} style={{display:'inline', verticalAlign:'text-bottom'}}/> {rsvps.length} RSVPs</p>
          </div>
          <div style={S.controls}>
             <button onClick={exportCSV} style={S.exportBtn} disabled={rsvps.length === 0}>
               <Download size={16} /> Export CSV
             </button>
          </div>
        </div>

        {loading ? (
          <div style={S.empty}>Loading attendees...</div>
        ) : rsvps.length === 0 ? (
          <div style={S.empty}>No one has RSVP'd to this event yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Check-In</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map(rsvp => (
                  <tr key={rsvp._id}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600 }}>{rsvp.user?.name || 'Unknown'}</div>
                      {rsvp.user?.rollNumber && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{rsvp.user.rollNumber}</div>}
                    </td>
                    <td style={S.td}>{rsvp.user?.email}</td>
                    <td style={S.td}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                        background: rsvp.status === 'confirmed' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)',
                        color: rsvp.status === 'confirmed' ? 'var(--green)' : 'var(--accent)'
                      }}>
                        {rsvp.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button 
                        onClick={() => toggleCheckIn(rsvp._id)}
                        style={{
                          ...S.checkBtn,
                          color: rsvp.checkedIn ? 'var(--green)' : 'var(--muted)',
                          background: rsvp.checkedIn ? 'rgba(74,222,128,0.1)' : 'var(--bg3)'
                        }}
                      >
                        {rsvp.checkedIn ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {rsvp.checkedIn ? 'Checked In' : 'Check In'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}