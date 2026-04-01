const router       = require('express').Router();
const Notification = require('../models/Notification');
const auth         = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const notifs = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifs);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user.id, read: false });
    res.json({ count });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

module.exports = router;