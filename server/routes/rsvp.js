const router = require('express').Router();
const RSVP   = require('../models/RSVP');
const Event  = require('../models/Event');
const auth   = require('../middleware/auth');

// Get all attendees for a specific event (Club Organizer only)
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    
    // Authorization check - only the club that created the event, admin, or faculty can view
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Not authorized to view attendees' });
    if (req.user.role === 'club' && (!event.club || event.club.toString() !== req.user.id)) {
       return res.status(403).json({ msg: 'Not authorized for this event' });
    }

    const attendees = await RSVP.find({ event: req.params.eventId })
      .populate('user', 'name email rollNumber')
      .sort({ createdAt: -1 });
      
    res.json(attendees);
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

// Toggle check-in status (Club Organizer only)
router.put('/:rsvpId/checkin', auth, async (req, res) => {
  try {
    const rsvp = await RSVP.findById(req.params.rsvpId).populate('event');
    if (!rsvp) return res.status(404).json({ msg: 'RSVP not found' });

    // Authorization check
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Not authorized' });
    if (req.user.role === 'club' && (!rsvp.event.club || rsvp.event.club.toString() !== req.user.id)) {
       return res.status(403).json({ msg: 'Not authorized for this event' });
    }

    rsvp.checkedIn = !rsvp.checkedIn;
    await rsvp.save();
    
    res.json({ checkedIn: rsvp.checkedIn });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

// Toggle RSVP — POST same endpoint cancels if already RSVPd
router.post('/:eventId', auth, async (req, res) => {
  try {
    const eventParams = await Event.findById(req.params.eventId);
    if (!eventParams) return res.status(404).json({ msg: 'Event not found' });

    const existing = await RSVP.findOne({
      user: req.user.id, event: req.params.eventId
    });

    if (existing) {
      // Cancel RSVP
      await RSVP.deleteOne({ _id: existing._id });
      await Event.findByIdAndUpdate(req.params.eventId, { $inc: { rsvpCount: -1 } });
      return res.json({ rsvpd: false, msg: 'RSVP cancelled' });
    }

    // Add RSVP capacity check
    if (eventParams.maxCapacity && eventParams.rsvpCount >= eventParams.maxCapacity) {
      return res.status(400).json({ msg: 'Event is already at full capacity' });
    }

    // Add RSVP
    await RSVP.create({ user: req.user.id, event: req.params.eventId });
    await Event.findByIdAndUpdate(req.params.eventId, { $inc: { rsvpCount: 1 } });
    return res.json({ rsvpd: true, msg: 'RSVP confirmed' });

  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// Get my RSVPd event IDs (for highlighting buttons on load)
router.get('/mine/ids', auth, async (req, res) => {
  try {
    const rsvps = await RSVP.find({ user: req.user.id }).select('event');
    res.json(rsvps.map(r => r.event.toString()));
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// Get my RSVPd events (full populated)
router.get('/mine', auth, async (req, res) => {
  try {
    const rsvps = await RSVP.find({ user: req.user.id }).populate('event');
    res.json(rsvps.map(r => r.event).filter(Boolean));
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

module.exports = router;