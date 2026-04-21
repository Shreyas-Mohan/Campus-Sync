const router = require('express').Router();
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');

// Get all tickets for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Admin gets all tickets
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    // Cannot directly populate without model if defined dynamically unless we provide path
    // But we can retrieve the tickets and populate manually if needed. Or just leave it raw and handle in frontend if needed?
    // Actually, Model.populate(doc, { path: 'user', select: 'name email', model: doc.userModel }) - wait, that's possible.
    const tickets = await Ticket.find().sort({ createdAt: -1 });

    const populatedTickets = await Promise.all(tickets.map(async (t) => {
      // Find reporter
      let reporter = null;
      if (t.userModel === 'Club') {
         reporter = await require('../models/Club').findById(t.user).select('name email');
      } else {
         reporter = await require('../models/User').findById(t.user).select('name email role');
      }
      const tObj = t.toObject();
      tObj.reporter = reporter;
      return tObj;
    }));

    res.json(populatedTickets);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Create a new support ticket
router.post('/', auth, async (req, res) => {
  const { title, description, category } = req.body;
  if (!title || !description) return res.status(400).json({ msg: 'Title and description required' });

  try {
    const userModel = req.user.role === 'club' ? 'Club' : 'User';
    const newTicket = new Ticket({
      user: req.user.id,
      userModel,
      title,
      description,
      category: category || 'bug'
    });
    await newTicket.save();
    res.status(201).json(newTicket);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Update ticket status or add admin reply (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ msg: 'Not found' });

    if (req.body.status) ticket.status = req.body.status;
    if (req.body.adminReply) ticket.adminReply = req.body.adminReply;

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;