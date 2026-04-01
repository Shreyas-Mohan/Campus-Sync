const router       = require('express').Router();
const Comment      = require('../models/Comment');
const Event        = require('../models/Event');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const auth         = require('../middleware/auth');

// GET all comments for an event
router.get('/:eventId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ event: req.params.eventId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// POST a new comment on an event (any authenticated user)
router.post('/:eventId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ msg: 'Comment text is required' });

    // JWT only has id+role; fetch real name from DB
    let authorName = 'Student';
    let authorRole = 'student';
    
    if (req.user.role === 'club') {
      const Club = require('../models/Club');
      const dbClub = await Club.findById(req.user.id).select('name');
      if (dbClub) {
        authorName = dbClub.name;
        authorRole = 'organizer';
      }
    } else {
      const dbUser = await User.findById(req.user.id).select('name email role');
      if (dbUser) {
        authorName = dbUser.name || dbUser.email;
        authorRole = dbUser.role || 'student';
      }
    }

    const comment = await Comment.create({
      event:      req.params.eventId,
      author:     req.user.id,
      authorName: authorName,
      authorRole: authorRole,
      text:       text.trim(),
    });

    // Notify the event club/organizer (skip if commenter is the club itself)
    try {
      const event = await Event.findById(req.params.eventId).select('club title');
      if (event && event.club && event.club.toString() !== req.user.id) {
        await Notification.create({
          recipient:  event.club,
          type:       'comment',
          message:    `${authorName} commented on your event: "${text.trim().slice(0, 80)}${text.length > 80 ? '…' : ''}"`,
          eventId:    event._id,
          eventTitle: event.title,
          fromName:   authorName,
        });
      }
    } catch (_) { /* don't fail the comment if notification fails */ }

    res.status(201).json(comment);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// POST a reply to a comment (Any authenticated user)
router.post('/:eventId/comment/:commentId/reply', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ msg: 'Reply text is required' });

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });

    // JWT only has id+role; fetch real name from DB
    let authorName = 'Student';
    let authorRole = 'student';
    
    if (req.user.role === 'club') {
      const Club = require('../models/Club');
      const dbClub = await Club.findById(req.user.id).select('name');
      if (dbClub) {
        authorName = dbClub.name;
        authorRole = 'organizer';
      }
    } else {
      const dbUser = await User.findById(req.user.id).select('name email role');
      if (dbUser) {
        authorName = dbUser.name || dbUser.email;
        authorRole = dbUser.role || 'student';
      }
    }

    comment.replies.push({
      author:     req.user.id,
      authorName: authorName,
      authorRole: authorRole,
      text:       text.trim(),
    });
    await comment.save();
    res.json(comment);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// PUT (Edit) a comment
router.put('/:eventId/comment/:commentId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ msg: 'Comment text is required' });

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });
    
    // Allow club ownership or explicit author ID match
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorised to edit this comment' });
    }

    comment.text = text.trim();
    await comment.save();
    res.json(comment);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// DELETE a comment (author only)
router.delete('/:eventId/comment/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });
    if (comment.author.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not authorised' });
    await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ msg: 'Comment deleted' });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

module.exports = router;
