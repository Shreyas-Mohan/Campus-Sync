const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const User = require('../models/User');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const cloudinary = require('../utils/cloudinary');

// GET all clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await Club.find().select('-password -email');
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET club profile by ID or Slug
router.get('/:id', async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { slug: req.params.id };

    const club = await Club.findOne(query)
      .select('-password')
      .populate('coreTeam.userId', 'name profilePicture')
      .populate('followers', 'name');
    
    if (!club) return res.status(404).json({ msg: 'Club not found' });
    res.json(club);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET club events (split into upcoming and past) (using ID or Slug)
router.get('/:id/events', async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    let clubId = req.params.id;

    if (!isObjectId) {
      const club = await Club.findOne({ slug: req.params.id });
      if (!club) return res.status(404).json({ msg: 'Club not found' });
      clubId = club._id;
    }

    const events = await Event.find({ club: clubId }).populate('club', 'name logo slug');
    
    const now = new Date();
    const upcoming = events.filter(e => new Date(e.date) >= now);
    const past = events.filter(e => new Date(e.date) < now);

    res.json({ upcoming, past });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST follow a club (Student only)
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.user.role === 'club') {
      return res.status(403).json({ msg: 'Clubs cannot follow other clubs' });
    }

    const club = await Club.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!club) return res.status(404).json({ msg: 'Club not found' });
    
    if (club.followers.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Already following this club' });
    }

    club.followers.push(req.user.id);
    user.following.push(club._id);

    await club.save();
    await user.save();

    res.json({ msg: 'Successfully followed club', followers: club.followers });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST unfollow a club
router.post('/:id/unfollow', auth, async (req, res) => {
  try {
    if (req.user.role === 'club') {
      return res.status(403).json({ msg: 'Clubs cannot unfollow' });
    }

    const club = await Club.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!club) return res.status(404).json({ msg: 'Club not found' });

    club.followers = club.followers.filter(id => id.toString() !== req.user.id.toString());
    user.following = user.following.filter(id => id.toString() !== club._id.toString());

    await club.save();
    await user.save();

    res.json({ msg: 'Successfully unfollowed club', followers: club.followers });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// PUT update club profile (only the club itself can do this)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'club' || req.user.id !== req.params.id) {
      return res.status(403).json({ msg: 'Not authorized to update this club' });
    }

    const { description, coverImage, logo, coreTeam, socialLinks, isRecruiting } = req.body;
    
    // Build update object
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (coreTeam !== undefined) updateData.coreTeam = coreTeam;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (isRecruiting !== undefined) updateData.isRecruiting = isRecruiting;

    // Upload Cover Image if it's new (base64)
    if (coverImage !== undefined) {
      if (coverImage.startsWith('data:image')) {
        const uploadRes = await cloudinary.uploader.upload(coverImage, { folder: 'campussync/clubs' });
        updateData.coverImage = uploadRes.secure_url;
      } else {
        updateData.coverImage = coverImage;
      }
    }

    // Upload Logo if it's new (base64)
    if (logo !== undefined) {
      if (logo.startsWith('data:image')) {
        const uploadRes = await cloudinary.uploader.upload(logo, { folder: 'campussync/clubs' });
        updateData.logo = uploadRes.secure_url;
      } else {
        updateData.logo = logo;
      }
    }

    const club = await Club.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!club) return res.status(404).json({ msg: 'Club not found' });

    res.json(club);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST add a core team member using their student email
router.post('/:id/core-team', auth, async (req, res) => {
  try {
    if (req.user.role !== 'club' || req.user.id !== req.params.id) {
      return res.status(403).json({ msg: 'Not authorized to update this club' });
    }

    const { email, title } = req.body;
    if (!email || !title) return res.status(400).json({ msg: 'Email and title are required' });

    const student = await User.findOne({ email });
    if (!student) return res.status(404).json({ msg: 'Student not found with that email' });

    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ msg: 'Club not found' });

    // Check if already in team
    if (club.coreTeam.some(member => member.userId && member.userId.toString() === student._id.toString())) {
       return res.status(400).json({ msg: 'Student is already in the core team' });
    }

    club.coreTeam.push({
      userId: student._id,
      name: student.name,
      title: title
    });

    await club.save();
    
    // Return populated club data
    const updatedClub = await Club.findById(req.params.id)
       .select('-password')
       .populate('coreTeam.userId', 'name profilePicture')
       .populate('followers', 'name');
       
    res.json({ msg: 'Member added', club: updatedClub });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// DELETE remove a core team member
router.delete('/:id/core-team/:memberId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'club' || req.user.id !== req.params.id) {
      return res.status(403).json({ msg: 'Not authorized to update this club' });
    }

    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ msg: 'Club not found' });

    club.coreTeam = club.coreTeam.filter(member => member._id.toString() !== req.params.memberId);
    await club.save();

    const updatedClub = await Club.findById(req.params.id)
       .select('-password')
       .populate('coreTeam.userId', 'name profilePicture')
       .populate('followers', 'name');

    res.json({ msg: 'Member removed', club: updatedClub });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
