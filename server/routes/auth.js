const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const Club   = require('../models/Club');
const OTP    = require('../models/OTP');
const sendOTPEmail = require('../utils/sendOTP');
const auth   = require('../middleware/auth');

// List of official club emails allowed to register as a 'Club'
const ALLOWED_CLUB_EMAILS = [
  'manchtantra@iiitm.ac.in',
  'aasf@iiitm.ac.in',
  'ecell@iiitm.ac.in',
  'ieeestudentbranch@iiitm.ac.in',
  'ieee@iiitm.ac.in',
  'gdsc@iiitm.ac.in',
  'uthaan@iiitm.ac.in',
  'sac@iiitm.ac.in',
  'hindisamiti@iiitm.ac.in',
  'aurora@iiitm.ac.in',
  'infotsav@iiitm.ac.in',
  'urja@iiitm.ac.in',
  'sgm@iiitm.ac.in',
  'rotaract@iiitm.ac.in'
];

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Step 1: Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already registered' });

    await OTP.deleteMany({ email });
    const otp = generateOTP();
    await OTP.create({ email, otp });
    await sendOTPEmail(email, otp, name);
    res.json({ msg: 'OTP sent to your email' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Failed to send OTP. Check your email config.' });
  }
});

// Step 2: Verify OTP + Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, interests, otp } = req.body;

    const record = await OTP.findOne({ email });
    if (!record) return res.status(400).json({ msg: 'OTP expired or not sent. Please request a new one.' });
    if (record.otp !== otp) return res.status(400).json({ msg: 'Incorrect OTP. Please try again.' });

    await OTP.deleteMany({ email });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email, password: hashed, role, interests });
    const token  = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, interests: user.interests } });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

// Send OTP for Club Registration
router.post('/send-otp-club', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    // Validate club email via hardcoded list
    if (!ALLOWED_CLUB_EMAILS.includes(email.toLowerCase())) {
      return res.status(400).json({ msg: 'This email is not authorized for club registration.' });
    }

    const existing = await Club.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Club email already registered' });

    await OTP.deleteMany({ email });
    const otp = generateOTP();
    await OTP.create({ email, otp });
    await sendOTPEmail(email, otp, name);
    res.json({ msg: 'OTP sent to your club email' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Failed to send OTP.' });
  }
});

// Verify OTP + Register Club
router.post('/register-club', async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    // Validate club email via hardcoded list
    if (!ALLOWED_CLUB_EMAILS.includes(email.toLowerCase())) {
      return res.status(400).json({ msg: 'This email is not authorized for club registration.' });
    }

    const record = await OTP.findOne({ email });
    if (!record) return res.status(400).json({ msg: 'OTP expired or not sent.' });
    if (record.otp !== otp) return res.status(400).json({ msg: 'Incorrect OTP.' });
    await OTP.deleteMany({ email });

    const existing = await Club.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Club email already registered' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let finalSlug = slug;
    let counter = 1;
    while (await Club.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const hashed = await bcrypt.hash(password, 10);
    const club = await Club.create({ name, email, password: hashed, slug: finalSlug });
    const token = jwt.sign({ id: club._id, role: 'club' }, process.env.JWT_SECRET);

    res.json({ token, user: { id: club._id, name: club.name, email: club.email, role: 'club' } });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if it's a Club first
    let user = await Club.findOne({ email });
    let isClub = false;
    
    if (user) {
      isClub = true;
    } else {
      // If not a club, check User collection
      user = await User.findOne({ email });
    }

    if (!user) return res.status(400).json({ msg: 'User or Club not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: 'Invalid password' });

    const role = isClub ? 'club' : user.role;
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET);

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role, 
        ...(isClub ? {} : { interests: user.interests }) 
      } 
    });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

// GET current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    let account;
    if (req.user.role === 'club') {
      account = await Club.findById(req.user.id).select('-password');
      if (!account) return res.status(404).json({ msg: 'Club not found' });
      res.json({ id: account._id, name: account.name, email: account.email, role: 'club' });
    } else {
      account = await User.findById(req.user.id).select('-password');
      if (!account) return res.status(404).json({ msg: 'User not found' });
      res.json({ id: account._id, name: account.name, email: account.email, role: account.role, interests: account.interests });
    }
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// PATCH update profile (name + interests)
router.patch('/profile', auth, async (req, res) => {
  try {
    const { name, interests } = req.body;
    const updates = {};
    if (name?.trim()) updates.name = name.trim();
    
    if (req.user.role === 'club') {
      const club = await Club.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
      res.json({ id: club._id, name: club.name, email: club.email, role: 'club' });
    } else {
      if (Array.isArray(interests)) updates.interests = interests;
      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
      res.json({ id: user._id, name: user.name, email: user.email, role: user.role, interests: user.interests });
    }
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// POST Send OTP for password change
router.post('/send-otp-password', auth, async (req, res) => {
  try {
    let account = null;
    if (req.user.role === 'club') {
      account = await Club.findById(req.user.id);
    } else {
      account = await User.findById(req.user.id);
    }
    
    if (!account) return res.status(404).json({ msg: 'Account not found' });

    const email = account.email;
    const name = account.name;

    await OTP.deleteMany({ email });
    const otp = generateOTP();
    await OTP.create({ email, otp });
    await sendOTPEmail(email, otp, name);

    res.json({ msg: `OTP sent to ${email}` });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to send OTP', error: err.message });
  }
});

// POST Change Password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) return res.status(400).json({ msg: 'Please provide OTP and new password' });

    let account = null;
    if (req.user.role === 'club') {
      account = await Club.findById(req.user.id);
    } else {
      account = await User.findById(req.user.id);
    }
    if (!account) return res.status(404).json({ msg: 'Account not found' });

    const record = await OTP.findOne({ email: account.email });
    if (!record) return res.status(400).json({ msg: 'OTP expired or not sent.' });
    if (record.otp !== otp) return res.status(400).json({ msg: 'Invalid OTP' });

    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(newPassword, salt);
    await account.save();

    await OTP.deleteOne({ email: account.email });

    res.json({ msg: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to change password', error: err.message });
  }
});

module.exports = router;