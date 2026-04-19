import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ReactMarkdown from 'react-markdown';
import {
  Calendar, MapPin, Users, Tag, ArrowLeft,
  ExternalLink, Phone, Hash, User, BadgeCheck, Clock, Share2, CalendarPlus,
  MessageCircle, Send, Reply, Trash2, ChevronDown, ChevronUp,
  MoreHorizontal, Edit2, Building
} from 'lucide-react';

const CAT_CFG = {
  Tech:     { color: "var(--blue)", icon: '💻', bg: "var(--blue-dim)" },
  Music:    { color: "var(--purple)", icon: '🎵', bg: 'rgba(167,139,250,0.08)' },
  Sports:   { color: "var(--green)", icon: '⚽', bg: 'rgba(74,222,128,0.08)' },
  Culture:  { color: "var(--orange)", icon: '🎭', bg: 'rgba(251,146,60,0.08)' },
  Business: { color: '#60a5fa', icon: '💼', bg: 'rgba(96,165,250,0.08)' },
  Art:      { color: "var(--pink)", icon: '🎨', bg: 'rgba(244,114,182,0.08)' },
  Science:  { color: "var(--teal)", icon: '🔬', bg: 'rgba(45,212,191,0.08)' },
  Social:   { color: '#fbbf24', icon: '🎉', bg: 'rgba(251,191,36,0.08)' },
};

const STATUS_CFG = {
  approved: { color: "var(--green)", bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.25)',  label: '● Live' },
  pending:  { color: "var(--accent)", bg: 'rgba(232,201,122,0.08)', border: 'rgba(232,201,122,0.25)', label: '● Pending' },
  rejected: { color: "var(--red)", bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', label: '● Rejected' },
};

/* ─── Helpers ─── */
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ name, size = 36, color = "var(--blue)" }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color,
    }}>
      {initials}
    </div>
  );
}

/* ─── Comment + Reply components ─── */
function ReplyItem({ reply, onReplyTo }) {
  return (
    <div style={CS.replyItem}>
      <Avatar name={reply.authorName} size={28} color="var(--purple)" />
      <div style={{ flex: 1 }}>
        <div style={CS.replyMeta}>
          <span style={CS.replyAuthor}>{reply.authorName}</span>
          {reply.authorRole && reply.authorRole !== 'student' && (
            <span style={{ ...CS.roleBadge, background: 'rgba(167,139,250,0.12)', color: "var(--purple)", border: '1px solid rgba(167,139,250,0.3)' }}>
              {reply.authorRole === 'organizer' ? 'Organizer' : reply.authorRole}
            </span>
          )}
          <span style={CS.timestamp}>{timeAgo(reply.createdAt)}</span>
        </div>
        <p style={CS.replyText}>
          {reply.text.startsWith('@') ? (
            <>
              <span style={{ color: 'var(--purple)', fontWeight: 600 }}>{reply.text.split(' ')[0]}</span>
              {' ' + reply.text.substring(reply.text.indexOf(' ') + 1)}
            </>
          ) : (
            reply.text
          )}
        </p>
        <div style={{ marginTop: 4 }}>
          <button style={CS.actionBtn} onClick={() => onReplyTo(reply.authorName)}>
            <Reply size={11} /> Reply
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, isOrganizer, eventId, token, onReplyAdded, onDeleted, onEdited, currentUserId }) {
  const [showReplies, setShowReplies] = useState(true);
  const [replyOpen, setReplyOpen]     = useState(false);
  const [replyText, setReplyText]     = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [isHovered, setIsHovered]     = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [isEditing, setIsEditing]     = useState(false);
  const [editText, setEditText]       = useState(comment.text);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true); setError('');
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/comments/${eventId}/comment/${comment._id}/reply`,
        { text: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onReplyAdded(data);
      setReplyText(''); setReplyOpen(false);
    } catch (e) {
      setError(e.response?.data?.msg || 'Failed to post reply');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/comments/${eventId}/comment/${comment._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onDeleted(comment._id);
    } catch (e) {
      alert(e.response?.data?.msg || 'Failed to delete');
    }
  };

  const handleEdit = async () => {
    if (!editText.trim() || editText === comment.text) {
      setIsEditing(false);
      return;
    }
    try {
      const { data } = await axios.put(
        `${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/comments/${eventId}/comment/${comment._id}`,
        { text: editText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onEdited(data);
      setIsEditing(false);
    } catch (e) {
      alert(e.response?.data?.msg || 'Failed to edit');
    }
  };

  const startReplyingTo = (authorName) => {
    setReplyText(`@${authorName} `);
    setReplyOpen(true);
    setShowReplies(true);
  };

  return (
    <div 
      style={{ ...CS.commentCard, position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMenuOpen(false); }}
    >
      {comment.author === currentUserId && (isHovered || menuOpen) && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 10 }}>
          <button style={CS.actionBtn} onClick={() => setMenuOpen(v => !v)}>
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div style={{
              background: '#0a0c12', border: '1px solid var(--border)',
              borderRadius: 8, marginTop: 4, padding: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)', width: 90
            }}>
              <button 
                style={{ ...CS.actionBtn, padding: '6px 8px', width: '100%', justifyContent: 'flex-start' }}
                onClick={() => { setMenuOpen(false); setIsEditing(true); setEditText(comment.text); }}
              >
                <Edit2 size={12} /> Edit
              </button>
              <button 
                style={{ ...CS.actionBtn, padding: '6px 8px', width: '100%', justifyContent: 'flex-start', color: 'var(--red)' }}
                onClick={handleDelete}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
      <div style={CS.commentHeader}>
        <Avatar name={comment.authorName} size={36} color="var(--blue)" />
        <div style={{ flex: 1 }}>
          <div style={CS.commentMeta}>
            <span style={CS.commentAuthor}>{comment.authorName}</span>
            {comment.authorRole && comment.authorRole !== 'student' && (
              <span style={CS.roleBadge}>{comment.authorRole}</span>
            )}
            <span style={CS.timestamp}>{timeAgo(comment.createdAt)}{comment.createdAt !== comment.updatedAt && ' (edited)'}</span>
          </div>

          {isEditing ? (
            <div style={{ marginTop: 8 }}>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                style={CS.textarea}
                rows={2}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button style={CS.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                <button style={CS.sendBtn} onClick={handleEdit}>Save</button>
              </div>
            </div>
          ) : (
            <p style={CS.commentText}>{comment.text}</p>
          )}

          {/* Action row */}
          <div style={CS.actionRow}>
            <button style={CS.actionBtn} onClick={() => setReplyOpen(v => !v)}>
              <Reply size={13} /> Reply
            </button>
            {comment.replies?.length > 0 && (
              <button style={CS.actionBtn} onClick={() => setShowReplies(v => !v)}>
                {showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {/* Reply input */}
          {replyOpen && (
            <div style={CS.replyInput}>
              {/* "Replying to" context chip */}
              <div style={CS.replyingTo}>
                <Reply size={11} color="var(--purple)" />
                <span>Replying to <strong style={{ color: "var(--text)" }}>{comment.authorName}</strong></span>
              </div>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`Write your reply to ${comment.authorName}…`}
                rows={2}
                style={CS.textarea}
                autoFocus
              />
              {error && <p style={{ color: "var(--red)", fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button style={CS.cancelBtn} onClick={() => { setReplyOpen(false); setError(''); }}>Cancel</button>
                <button
                  style={{ ...CS.sendBtn, opacity: submitting ? 0.6 : 1 }}
                  onClick={handleReply}
                  disabled={submitting}
                >
                  <Send size={12} /> {submitting ? 'Sending…' : 'Post Reply'}
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {showReplies && comment.replies?.length > 0 && (
            <div style={CS.repliesWrap}>
              {comment.replies.map((r, i) => (
                <ReplyItem key={i} reply={r} onReplyTo={startReplyingTo} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main CommentsSection ─── */
function CommentsSection({ eventId, organizerId, token, user }) {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [newText,  setNewText]  = useState('');
  const [posting,  setPosting]  = useState(false);
  const [error,    setError]    = useState('');
  const textareaRef  = useRef(null);
  const sectionRef   = useRef(null);
  const location     = useLocation();

  const isOrganizer = user && organizerId &&
    (user.id?.toString() === organizerId?.toString() ||
     user._id?.toString() === organizerId?.toString());

  // Auto-scroll when navigated with #comments hash
  useEffect(() => {
    if (location.hash === '#comments' && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }, [location.hash]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/comments/${eventId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComments(data);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, [eventId, token]);

  const handlePost = async () => {
    if (!newText.trim()) return;
    setPosting(true); setError('');
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`}/api/comments/${eventId}`,
        { text: newText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(prev => [data, ...prev]);
      setNewText('');
    } catch (e) {
      setError(e.response?.data?.msg || 'Failed to post comment');
    } finally { setPosting(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePost();
  };

  const handleReplyAdded = (updatedComment) => {
    setComments(prev => prev.map(c => c._id === updatedComment._id ? updatedComment : c));
  };

  const handleDeleted = (commentId) => {
    setComments(prev => prev.filter(c => c._id !== commentId));
  };
  
  const handleEdited = (updatedComment) => {
    setComments(prev => prev.map(c => c._id === updatedComment._id ? updatedComment : c));
  };

  return (
    <div id="comments" ref={sectionRef} style={CS.section}>
      {/* Header */}
      <div style={CS.sectionHeader}>
        <MessageCircle size={18} color="var(--blue)" />
        <h2 style={CS.sectionTitle}>Questions & Comments</h2>
        <span style={CS.countBadge}>{comments.length}</span>
      </div>

      {isOrganizer && (
        <div style={CS.organizerNote}>
          <BadgeCheck size={14} color="var(--green)" />
          <span>You are the organizer — you can reply to questions</span>
        </div>
      )}

      {/* Post new comment */}
      <div style={CS.postBox}>
        <Avatar name={user?.name || user?.email || '?'} size={36} color="var(--blue)" />
        <div style={{ flex: 1 }}>
          <textarea
            ref={textareaRef}
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or leave a comment… (Ctrl+Enter to send)"
            rows={3}
            style={CS.textarea}
          />
          {error && <p style={{ color: "var(--red)", fontSize: 12, marginTop: 4 }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              style={{ ...CS.sendBtn, opacity: posting ? 0.6 : 1 }}
              onClick={handlePost}
              disabled={posting}
            >
              <Send size={13} /> {posting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: "var(--muted)", fontSize: 14 }}>
          Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <div style={CS.emptyState}>
          <MessageCircle size={36} color="var(--border)" />
          <p style={{ color: "var(--muted)", marginTop: 12, fontSize: 14 }}>
            No comments yet. Be the first to ask a question!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.map(c => (
            <CommentItem
              key={c._id}
              comment={c}
              isOrganizer={isOrganizer}
              eventId={eventId}
              token={token}
              onReplyAdded={handleReplyAdded}
              onDeleted={handleDeleted}
              onEdited={handleEdited}
              currentUserId={user?.id || user?._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Comment styles ─── */
const CS = {
  section: {
    marginTop: 8,
    background: '#0a0c12',
    border: '1px solid var(--bg4)',
    borderRadius: 18,
    padding: '28px 28px',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 22, color: "var(--text)", margin: 0, flex: 1,
  },
  countBadge: {
    background: "var(--blue-dim)", color: "var(--blue)",
    border: '1px solid var(--blue-border)',
    borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700,
  },
  organizerNote: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)',
    borderRadius: 10, padding: '10px 14px', marginBottom: 20,
    fontSize: 13, color: "var(--green)", fontWeight: 500,
  },
  postBox: {
    display: 'flex', gap: 12, marginBottom: 28,
    paddingBottom: 28, borderBottom: '1px solid var(--bg3)',
  },
  textarea: {
    width: '100%', background: "var(--bg2)",
    border: '1px solid var(--border)', borderRadius: 10,
    padding: '12px 14px', fontSize: 14, color: "var(--text)",
    lineHeight: 1.6, resize: 'vertical', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  sendBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg,var(--blue),var(--blue2))',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '9px 18px', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.2s',
  },
  cancelBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'none', color: "var(--muted)",
    border: '1px solid var(--border)', borderRadius: 10,
    padding: '9px 14px', fontSize: 13, cursor: 'pointer',
  },
  commentCard: {
    background: "var(--bg2)", border: '1px solid var(--bg4)',
    borderRadius: 14, padding: '16px 18px',
    transition: 'border-color 0.2s',
  },
  commentHeader: { display: 'flex', gap: 12 },
  commentMeta:   { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  commentAuthor: { fontSize: 14, fontWeight: 700, color: "var(--text)" },
  commentText:   { fontSize: 14, color: '#b0b8cc', lineHeight: 1.7, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
  roleBadge: {
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
    background: "var(--blue-dim)", color: "var(--blue)",
    border: '1px solid var(--blue-border)', textTransform: 'capitalize',
  },
  timestamp: { fontSize: 11, color: "var(--faint)" },
  actionRow:  { display: 'flex', gap: 12, marginTop: 10, alignItems: 'center' },
  actionBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'none', border: 'none', color: "var(--muted)",
    fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
    transition: 'color 0.15s',
  },
  replyInput: {
    marginTop: 12, padding: '14px', background: '#0a0c12',
    border: '1px solid var(--border)', borderRadius: 10,
  },
  replyingTo: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, color: "var(--purple)", marginBottom: 8,
    background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
    borderRadius: 6, padding: '5px 10px',
  },
  repliesWrap: {
    marginTop: 14, paddingLeft: 16,
    borderLeft: '2px solid rgba(167,139,250,0.2)',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  replyItem: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  replyMeta: { display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 },
  replyAuthor: { fontSize: 13, fontWeight: 700, color: '#dde1f0' },
  replyText:   { fontSize: 13, color: "var(--text2)", lineHeight: 1.6, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
  emptyState: {
    textAlign: 'center', padding: '40px 0',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
};

/* ─── Main EventDetails ─── */
export default function EventDetails() {
  const { id }           = useParams();
  const { token, user }  = useAuth();
  const navigate         = useNavigate();
  const [event,   setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: all } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/all`,
          { headers: { Authorization: `Bearer ${token}` } });
        const found = all.find(e => e._id === id);
        if (found) { setEvent(found); }
        else {
          const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events`,
            { headers: { Authorization: `Bearer ${token}` } });
          setEvent(data.find(e => e._id === id) || null);
        }
      } catch {
        try {
          const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events`,
            { headers: { Authorization: `Bearer ${token}` } });
          setEvent(data.find(e => e._id === id) || null);
        } catch {}
      } finally { setLoading(false); }
    };
    fetch();
  }, [id, token]);

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: '100vh', background: "var(--bg)" }}>
      <Navbar title="Event Details" />
      <div style={S.loadingWrap}>
        <div style={S.spinner} />
        <p style={{ color: "var(--muted)", marginTop: 16, fontSize: 14 }}>Loading event…</p>
      </div>
    </div>
  );

  // ── Not found ──
  if (!event) return (
    <div style={{ minHeight: '100vh', background: "var(--bg)" }}>
      <Navbar title="Event Details" />
      <div style={S.notFound}>
        <p style={{ fontSize: 56, marginBottom: 16 }}>🔍</p>
        <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, marginBottom: 8 }}>Event not found</h2>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>This event may have been removed or doesn't exist.</p>
        <button onClick={() => navigate(-1)} style={S.backBtn}><ArrowLeft size={14} /> Go Back</button>
      </div>
    </div>
  );

  const cc = CAT_CFG[event.category] || { color: "var(--blue)", icon: '📅', bg: "var(--blue-dim)" };
  
  const isPastEvent = new Date(event.date) < new Date();
  let sc = STATUS_CFG[event.status] || STATUS_CFG.pending;
  if (event.status === 'approved' && isPastEvent) {
    sc = STATUS_CFG.past;
  }

  const fmtDate = new Date(event.date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const fmtTime = new Date(event.date).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });
  const rsvpPct = event.maxCapacity
    ? Math.min(100, Math.round(((event.rsvpCount || 0) / event.maxCapacity) * 100))
    : null;

  const isSoldOut = event.maxCapacity && (event.rsvpCount >= event.maxCapacity);

  const handleAddToCalendar = () => {
    const startDate = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDateObj = new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000); // assume 2 hours
    const endDate = endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', event.title);
    url.searchParams.append('dates', `${startDate}/${endDate}`);
    url.searchParams.append('details', event.detailedDescription || event.description || '');
    url.searchParams.append('location', event.venue || 'TBD');
    window.open(url.toString(), '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: "var(--bg)" }}>
      <Navbar title="Event Details" />

      {/* ── Poster / Hero ─────────────────────────────────────────── */}
      <div style={S.posterSection}>
        {event.poster ? (
          <>
            {/* Heavily blur the hero background so the full poster can shine in the body */}
            <img src={event.poster} alt={event.title} style={{ ...S.posterImg, filter: 'blur(40px) brightness(0.4)', transform: 'scale(1.2)' }} />
            <div style={S.posterOverlay} />
          </>
        ) : (
          <div style={{ ...S.posterFallback, background: `linear-gradient(135deg, ${cc.color}22 0%, var(--bg) 100%)` }}>
            <span style={{ fontSize: 80, filter: 'saturate(0.8)' }}>{cc.icon}</span>
          </div>
        )}

        {/* Floating badge row over poster */}
        <div style={S.posterBadges}>
          <button onClick={() => navigate(-1)} style={S.floatBack}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={S.badgeRight}>
            <span style={{ ...S.catBadge, color: cc.color, background: cc.bg, border: `1px solid ${cc.color}44` }}>
              {cc.icon} {event.category}
            </span>
            <span style={{ ...S.statusBadge, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
              {sc.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div style={S.container}>
        <div style={S.layout}>

          {/* ── LEFT ── */}
          <div style={S.left}>
            <div style={{ animation: 'fadeUp 0.4s ease' }}>
              <h1 style={S.title}>{event.title}</h1>

              {event.description && (
                <p style={S.shortDesc}>{event.description}</p>
              )}

              {/* Meta cards */}
              <div style={S.metaGrid}>
                <div style={S.metaCard}>
                  <div style={{ ...S.metaIcon, background: cc.color + '18' }}>
                    <Calendar size={16} color={cc.color} />
                  </div>
                  <div>
                    <div style={S.metaLabel}>Date</div>
                    <div style={S.metaVal}>{fmtDate}</div>
                  </div>
                </div>
                <div style={S.metaCard}>
                  <div style={{ ...S.metaIcon, background: 'rgba(167,139,250,0.12)' }}>
                    <Clock size={16} color="var(--purple)" />
                  </div>
                  <div>
                    <div style={S.metaLabel}>Time</div>
                    <div style={S.metaVal}>{fmtTime}</div>
                  </div>
                </div>
                <div style={S.metaCard}>
                  <div style={{ ...S.metaIcon, background: 'rgba(244,114,182,0.12)' }}>
                    <MapPin size={16} color="var(--pink)" />
                  </div>
                  <div>
                    <div style={S.metaLabel}>Venue</div>
                    <div style={S.metaVal}>{event.venue}</div>
                  </div>
                </div>
                {event.maxCapacity && (
                  <div style={S.metaCard}>
                    <div style={{ ...S.metaIcon, background: 'rgba(74,222,128,0.12)' }}>
                      <Users size={16} color="var(--green)" />
                    </div>
                    <div>
                      <div style={S.metaLabel}>Capacity</div>
                      <div style={S.metaVal}>{event.maxCapacity} seats</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {event.tags?.length > 0 && (
                <div style={S.tagsRow}>
                  <Tag size={12} color="var(--muted)" />
                  {event.tags.map(t => (
                    <span key={t} style={S.tag}>{t}</span>
                  ))}
                </div>
              )}

              {/* Divider */}
              <div style={S.divider} />

              {/* Detailed Description */}
              {event.detailedDescription && (
                <div style={S.descSection}>
                  <h2 style={S.descTitle}>About this Event</h2>
                  <div style={S.detailedText} className="markdown-content">
                    <ReactMarkdown>{event.detailedDescription}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Apply Now */}
              {event.applicationLink && (
                <div style={S.applyBox}>
                  <div style={S.applyGlow} />
                  <div style={S.applyLeft}>
                    <p style={S.applyTitle}>
                      {isPastEvent ? 'Event Ended' : isSoldOut ? 'Sold Out' : 'Ready to join?'}
                    </p>
                    <p style={S.applySub}>
                      {isPastEvent 
                        ? 'This event has already taken place.' 
                        : isSoldOut 
                          ? 'All seats for this event have been filled.' 
                          : 'Register through the official link before seats fill up.'}
                    </p>
                  </div>
                  {isPastEvent || isSoldOut ? (
                    <div style={{ ...S.applyBtn, background: 'var(--bg3)', boxShadow: 'none', color: 'var(--muted)', cursor: 'not-allowed' }}>
                      {isPastEvent ? 'Ended' : 'Sold Out'}
                    </div>
                  ) : (
                    <a
                      href={event.applicationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={S.applyBtn}
                    >
                      Apply Now <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}

              {/* Full Uncropped Poster Display (Moved below the details to allow users to see crucial info first) */}
              {event.poster && (
                <div style={S.fullPosterContainer}>
                  <img src={event.poster} alt={`${event.title} full poster`} style={S.fullPosterImg} />
                </div>
              )}

              {/* ── Comments Section ────────────────────────────── */}
              <CommentsSection
                eventId={event._id}
                organizerId={event.organizer}
                token={token}
                user={user}
              />
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={S.right}>

            {/* Attendance card — hidden for admin */}
            {user?.role !== 'admin' && (
              <div style={S.sideCard}>
                <div style={S.sideCardHead}>
                  <Users size={15} color="var(--green)" />
                  <span>Attendance</span>
                </div>
                <div style={S.rsvpCount}>{event.rsvpCount || 0}</div>
                <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>people are going</div>
                {rsvpPct !== null && (
                  <>
                    <div style={S.progressBg}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${rsvpPct}%`,
                        background: `linear-gradient(90deg, ${cc.color}, var(--purple))`,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                    <div style={S.progressLabel}>
                      <span style={{ color: cc.color, fontWeight: 600 }}>{rsvpPct}% full</span>
                      <span>{event.maxCapacity - (event.rsvpCount || 0)} spots left</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Contact Organizers */}
            <div style={S.sideCard}>
              <div style={S.sideCardHead}>
                <BadgeCheck size={15} color="var(--blue)" />
                <span>Contact Organizers</span>
              </div>

              {[event.eventHead1, event.eventHead2].map((head, idx) => {
                if (!head?.name) return null;
                return (
                  <div key={idx} style={{ ...S.headItem, borderTop: idx > 0 ? '1px solid var(--bg3)' : 'none', paddingTop: idx > 0 ? 14 : 0 }}>
                    <div style={S.headAvatar}>
                      <User size={16} color="var(--blue)" />
                    </div>
                    <div style={S.headInfo}>
                      <div style={S.headRole}>Event Head {idx + 1}</div>
                      <div style={S.headName}>{head.name}</div>
                      {head.rollNo && (
                        <div style={S.headDetail}>
                          <Hash size={11} color="var(--muted)" />
                          <span>{head.rollNo}</span>
                        </div>
                      )}
                      {head.contact && (
                        <a href={`tel:${head.contact}`} style={{ ...S.headDetail, color: "var(--blue)" }}>
                          <Phone size={11} />
                          <span>{head.contact}</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              {!event.eventHead1?.name && !event.eventHead2?.name && (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No contact info provided.</p>
              )}
            </div>

            {/* Organizer chip */}
            {(event.club || event.organizerName) && (
              <div style={S.sideCard}>
                <div style={S.sideCardHead}>
                  {event.club ? <Building size={15} color="var(--primary)" /> : <User size={15} color="var(--accent)" />}
                  <span>Organized by</span>
                </div>
                {event.club ? (
                  <Link to={`/club/${event.club.slug || event.club._id || event.club}`} style={{ ...S.orgName, color: 'var(--primary)', textDecoration: 'none' }}>
                    {event.club.name || 'View Club'}
                  </Link>
                ) : (
                  <div style={S.orgName}>{event.organizerName}</div>
                )}
              </div>
            )}

            {/* Share & Calendar */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                style={{ ...S.shareBtn, flex: 1 }} 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: event.title,
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
              >
                <Share2 size={14} /> Share
              </button>
              <button 
                style={{ ...S.shareBtn, flex: 1, border: '1px solid var(--border)' }} 
                onClick={handleAddToCalendar}
              >
                <CalendarPlus size={14} /> Add to Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  loadingWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
  },
  spinner: {
    width: 36, height: 36, border: '3px solid var(--border)',
    borderTopColor: "var(--blue)", borderRadius: '50%',
    animation: 'spin 0.75s linear infinite',
  },
  notFound: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)', textAlign: 'center', padding: 24,
  },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: "var(--blue-dim)", border: '1px solid var(--blue-border)',
    color: "var(--blue)", borderRadius: 10, padding: '10px 20px',
    fontSize: 14, fontWeight: 600,
  },

  // Poster hero
  posterSection: {
    width: '100%', height: 160, position: 'relative', overflow: 'hidden',
    background: "var(--bg2)",
  },
  posterImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  posterOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(8,9,16,0.2) 0%, rgba(8,9,16,0.85) 100%)',
  },
  posterFallback: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  posterBadges: {
    position: 'absolute', top: 20, left: 20, right: 20,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  floatBack: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(8,9,16,0.6)', border: '1px solid rgba(255,255,255,0.1)',
    color: "var(--text)", borderRadius: 10, padding: '8px 16px',
    fontSize: 13, fontWeight: 500,
    backdropFilter: 'blur(12px)',
  },
  badgeRight: { display: 'flex', gap: 8 },
  catBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 99,
    backdropFilter: 'blur(12px)',
  },
  statusBadge: {
    fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 99,
    backdropFilter: 'blur(12px)',
  },

  container: { maxWidth: 1200, margin: '0 auto', padding: '36px 28px 80px' },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: 32, alignItems: 'start',
  },
  left:  { display: 'flex', flexDirection: 'column', gap: 24 },
  right: { display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 84 },

  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 40, color: "var(--text)", lineHeight: 1.15,
    marginBottom: 10, wordBreak: 'break-word',
  },
  shortDesc: { fontSize: 16, color: "var(--text2)", lineHeight: 1.75, marginBottom: 4 },
  
  fullPosterContainer: {
    margin: '24px 0',
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullPosterImg: {
    width: '100%',
    height: 'auto',
    display: 'block',
    maxHeight: '800px', /* Keeps massive vertical crops somewhat contained on huge desktop monitors */
    objectFit: 'contain'
  },

  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '24px 0' },
  metaCard: {
    background: "var(--bg2)", border: '1px solid var(--border)', borderRadius: 12,
    padding: '16px', display: 'flex', alignItems: 'center', gap: 16,
    transition: 'border-color 0.2s',
  },
  metaIcon: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  metaLabel: { fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  metaVal:   { fontSize: 15, color: "var(--text)", fontWeight: 500 },

  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 24, marginBottom: 24 },
  tag: {
    fontSize: 13, background: "var(--bg2)", border: '1px solid var(--border)',
    padding: '6px 14px', borderRadius: 99, color: "var(--text2)",
  },

  divider: { height: 1, background: "var(--bg3)", margin: '32px 0' },

  descSection: { marginTop: 24, marginBottom: 32 },
  descTitle: {
    fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "var(--text)", marginBottom: 14,
  },
  detailedText: {
    fontSize: 15, color: '#b0b8cc', lineHeight: 1.9, whiteSpace: 'pre-wrap',
  },

  applyBox: {
    position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(135deg, var(--blue-dim) 0%, rgba(15,17,23,1) 100%)',
    border: '1px solid var(--blue-border)',
    borderRadius: 16, padding: '24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
  },
  applyGlow: {
    position: 'absolute', top: -40, left: -40, width: 200, height: 200,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(91,141,238,0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  applyLeft: { position: 'relative', zIndex: 1 },
  applyTitle: { fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 5 },
  applySub:   { fontSize: 13, color: "var(--muted)", lineHeight: 1.5 },
  applyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
    background: 'linear-gradient(135deg,var(--blue),var(--blue2))',
    color: '#fff', textDecoration: 'none', borderRadius: 12,
    padding: '12px 24px', fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 20px rgba(91,141,238,0.4)',
    whiteSpace: 'nowrap', position: 'relative', zIndex: 1,
  },

  // Sidebar
  sideCard: {
    background: "var(--bg2)", border: '1px solid var(--border)', borderRadius: 14,
    padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12,
  },
  sideCardHead: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, fontWeight: 700, color: "var(--text)",
    paddingBottom: 12, borderBottom: '1px solid var(--bg3)',
  },

  rsvpCount: {
    fontFamily: "'DM Serif Display', serif", fontSize: 44, color: "var(--green)", lineHeight: 1,
  },
  progressBg: { height: 6, background: "var(--bg4)", borderRadius: 99, overflow: 'hidden' },
  progressLabel: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 12, color: "var(--muted)",
  },

  headItem: { display: 'flex', gap: 12, paddingTop: 0 },
  headAvatar: {
    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
    background: "var(--blue-dim)", border: '1px solid rgba(91,141,238,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  headInfo:   { flex: 1 },
  headRole:   { fontSize: 10, color: "var(--blue)", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 },
  headName:   { fontSize: 15, color: "var(--text)", fontWeight: 600, marginBottom: 5 },
  headDetail: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: "var(--text2)", marginTop: 3, textDecoration: 'none' },

  orgName: { fontSize: 16, color: "var(--accent)", fontWeight: 700 },

  shareBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'none', border: '1px solid var(--border)',
    color: "var(--text2)", borderRadius: 12, padding: '11px',
    fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
  },
};
