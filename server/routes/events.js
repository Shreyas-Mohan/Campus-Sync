const router       = require('express').Router();
const Event        = require('../models/Event');
const RSVP         = require('../models/RSVP');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const auth         = require('../middleware/auth');
const cloudinary   = require('../utils/cloudinary');

// All approved events (student feed)
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' }).sort({ date: 1 }).populate('club', 'name slug email logo');
    res.json(events);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// All events (organizer / admin / faculty)
router.get('/all', auth, async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).populate('club', 'name slug email logo');
    res.json(events);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// Get current club's draft event
router.get('/draft', auth, async (req, res) => {
  if (req.user.role !== 'club') return res.status(403).json({ msg: 'Only clubs have drafts' });
  try {
    const draft = await Event.findOne({ club: req.user.id, status: 'draft' }).sort({ createdAt: -1 });
    if (!draft) return res.status(404).json({ msg: 'No draft found' });
    res.json(draft);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// Create/Update draft event
router.post('/draft', auth, async (req, res) => {
  if (req.user.role !== 'club') return res.status(403).json({ msg: 'Only clubs have drafts' });
  try {
    const existing = await Event.findOne({ club: req.user.id, status: 'draft' });
    const eventData = { ...req.body, status: 'draft', club: req.user.id, clubName: req.user.name };
    if (existing) {
      const updated = await Event.findByIdAndUpdate(existing._id, eventData, { new: true });
      return res.json(updated);
    }
    const drafting = new Event(eventData);
    await drafting.save();
    res.json(drafting);
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

// Delete current club's draft event
router.delete('/draft', auth, async (req, res) => {
  if (req.user.role !== 'club') return res.status(403).json({ msg: 'Unauthorized' });
  try {
    await Event.deleteMany({ club: req.user.id, status: 'draft' });
    res.json({ msg: 'Draft discarded' });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

// Create event
router.post('/', auth, async (req, res) => {
  try {
    const eventData = { ...req.body };
    
    // Upload poster to Cloudinary if it's base64
    if (eventData.poster && eventData.poster.startsWith('data:image')) {
      const uploadRes = await cloudinary.uploader.upload(eventData.poster, {
        folder: 'campussync/events'
      });
      eventData.poster = uploadRes.secure_url;
    }

    let organizerName = req.user.name || 'Organizer';
    
    if (req.user.role === 'club') {
      eventData.club = req.user.id;
      eventData.clubName = req.body.clubName || req.user.name;
    }
    const event = await Event.create(eventData);

    // Notify ALL followers of this club! (Only if NOT draft)
    try {
      if (req.user.role === 'club' && event.status !== 'draft') {
        const Club = require('../models/Club');
        const clubUser = await Club.findById(req.user.id).select('name followers');
        if (clubUser && clubUser.followers && clubUser.followers.length > 0) {
          organizerName = clubUser.name;
          const notifDocs = clubUser.followers.map(studentId => ({
            recipient:  studentId,
            type:       'new_event',
            message:    `${organizerName} just published a new event: "${event.title}". Tap to check it out!`,
            eventId:    event._id,
            eventTitle: event.title,
            fromName:   organizerName,
          }));
          await Notification.insertMany(notifDocs);
        }
      }
    } catch (err) { console.log('Notification error: ', err); }

    res.status(201).json(event);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('club', 'name slug email logo');
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.json(event);
  } catch (e) {
    if (e.kind === 'ObjectId') return res.status(404).json({ msg: 'Event not found' });
    res.status(500).json({ msg: e.message });
  }
});

// Update event (club who owns it only)
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    if (event.club && event.club.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not authorised' });

    const updateData = { ...req.body };

    if (updateData.needsReapproval || event.status === 'rejected') {
      updateData.status = 'pending';
      updateData.isReapprovalRequest = !!updateData.needsReapproval;
      if (updateData.needsReapproval) {
        updateData.reapprovalNote = updateData.reapprovalNote || '';
      }
    } else {
      updateData.status = event.status; 
    }

    // Upload poster to Cloudinary if it's base64
    if (updateData.poster && updateData.poster.startsWith('data:image')) {
      const uploadRes = await cloudinary.uploader.upload(updateData.poster, {
        folder: 'campussync/events'
      });
      updateData.poster = uploadRes.secure_url;
    }

    const updated = await Event.findByIdAndUpdate(
      req.params.id, updateData, { new: true }
    );

    // Notify all students + admins about the event update
    try {
      let organizerName = 'Organizer';
      if (req.user.role === 'club') {
        const Club = require('../models/Club');
        const clubUser = await Club.findById(req.user.id).select('name');
        if (clubUser) organizerName = clubUser.name;
      } else {
        const organizerUser = await User.findById(req.user.id).select('name');
        if (organizerUser) organizerName = organizerUser.name;
      }
      
      const RSVP = require('../models/RSVP');
      const activeRsvps = await RSVP.find({ event: event._id }).select('user');
      
      const notifDocs = activeRsvps.map(rsvp => ({
        recipient:  rsvp.user,
        type:       'event_update',
        message:    `${organizerName} updated the event "${event.title}". Check out the latest details!`,
        eventId:    event._id,
        eventTitle: event.title,
        fromName:   organizerName,
      }));
      if (notifDocs.length) await Notification.insertMany(notifDocs);
    } catch (_) { /* don't fail update if notification fails */ }

    res.json(updated);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// Delete event (club who owns it, or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    const isOwner = event.club && event.club.toString() === req.user.id;
    const isAdmin = ['admin', 'faculty'].includes(req.user.role);
    if (!isOwner && !isAdmin)
      return res.status(403).json({ msg: 'Not authorised' });

    await Event.findByIdAndDelete(req.params.id);
    await RSVP.deleteMany({ event: req.params.id });
    
    // Clean up orphans
    const Comment = require('../models/Comment');
    await Comment.deleteMany({ event: req.params.id });
    await Notification.deleteMany({ eventId: req.params.id });
    
    res.json({ msg: 'Event deleted' });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// Approve / reject (faculty / admin)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const updatePayload = { status: req.body.status };
    if (req.body.facultyNote !== undefined) {
      updatePayload.facultyNote = req.body.facultyNote;
    }
    if (req.body.status === 'approved' || req.body.status === 'rejected') {
      updatePayload.isReapprovalRequest = false;
      updatePayload.reapprovalNote = '';
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id, updatePayload, { new: true }
    );

    // Notify club about approval/rejection
    try {
      if (req.body.status === 'approved' || req.body.status === 'rejected') {
        const Notification = require('../models/Notification');
        const targetOrg = event.club || event.organizer;
        if (targetOrg) {
          await Notification.create({
            recipient: targetOrg,
            type: 'event_approval',
            message: `Your event "${event.title}" was ${req.body.status} by the Faculty.`,
            eventId: event._id
          });
        }
      }
    } catch (err) {
      console.error('Failed to notify club:', err);
    }

    res.json(event);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

module.exports = router;