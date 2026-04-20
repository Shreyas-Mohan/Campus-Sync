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
    // Basic auth check for admin role can go here if needed, ignoring for simple implementation
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const tickets = await Ticket.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Create a new support ticket
router.post('/', auth, async (req, res) => {
  const { title, description, category } = req.body;
  if (!title || !description) return res.status(400).json({ msg: 'Title and description required' });

  try {
    const newTicket = new Ticket({
      user: req.user.id,
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