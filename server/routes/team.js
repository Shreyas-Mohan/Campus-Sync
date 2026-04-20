const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Club = require('../models/Club');
const User = require('../models/User');
const ClubInvite = require('../models/ClubInvite');

// 1. Send invite to email
router.post('/invite', auth, async (req, res) => {
  try {
    const { clubId, email, role } = req.body;
    // Check if user is owner of club or an admin manager
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ msg: 'Club not found' });
    
    // Authorization
    const isOwner = req.user.id === club._id.toString();
    const isManagerAdmin = club.managers.some(m => m.user.toString() === req.user.id && m.role === 'admin');
    
    if (req.user.role !== 'admin' && !isOwner && !isManagerAdmin) {
      return res.status(403).json({ msg: 'Only admins can send invites' });
    }

    const invitee = await User.findOne({ email });
    if (!invitee) return res.status(404).json({ msg: 'No user registered with this email.' });

    // Check if already member
    const alreadyMember = club.managers.some(m => m.user.toString() === invitee._id.toString());
    if (alreadyMember) return res.status(400).json({ msg: 'User is already a team manager' });

    // Check if already invited
    const existingInvite = await ClubInvite.findOne({ club: clubId, email, status: 'pending' });
    if (existingInvite) return res.status(400).json({ msg: 'Invite already sent to this user' });

    const invite = await ClubInvite.create({
      club: clubId,
      email,
      role: role || 'event_manager',
      status: 'pending'
    });

    res.json({ msg: 'Invite sent', invite });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 2. Get club's pending invites and current team Members
router.get('/club/:clubId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId).populate('managers.user', 'name email avatar');
    if (!club) return res.status(404).json({ msg: 'Club not found' });

    const isOwner = req.user.id === club._id.toString();
    const isManager = club.managers.some(m => m.user._id.toString() === req.user.id);
    if (req.user.role !== 'admin' && !isOwner && !isManager) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const invites = await ClubInvite.find({ club: req.params.clubId });
    res.json({ managers: club.managers, invites });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 3. User gets their pending invites
router.get('/my-invites', auth, async (req, res) => {
  try {
    const invites = await ClubInvite.find({ email: req.user.email, status: 'pending' }).populate('club', 'name logo');
    res.json(invites);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 4. User accepts/rejects invite
router.post('/invite/:inviteId/respond', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const invite = await ClubInvite.findById(req.params.inviteId);
    
    if (!invite || invite.status !== 'pending') {
      return res.status(400).json({ msg: 'Invalid or expired invite' });
    }

    if (invite.email !== req.user.email) {
      return res.status(403).json({ msg: 'Not invited' });
    }

    if (action === 'accept') {
      invite.status = 'accepted';
      await invite.save();
      
      const permissions = invite.role === 'admin' 
        ? { canPostEvents: true, canEditProfile: true }
        : invite.role === 'editor' 
          ? { canPostEvents: false, canEditProfile: true }
          : { canPostEvents: true, canEditProfile: false };

      await Club.findByIdAndUpdate(invite.club, {
        $push: {
          managers: { user: req.user.id, role: invite.role, permissions }
        }
      });
      res.json({ msg: 'Invite accepted' });
    } else {
      invite.status = 'rejected';
      await invite.save();
      res.json({ msg: 'Invite rejected' });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 5. Remove team member
router.delete('/club/:clubId/member/:memberId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ msg: 'Club not found' });
    
    const isOwner = req.user.id === club._id.toString();
    const isManagerAdmin = club.managers.some(m => m.user.toString() === req.user.id && m.role === 'admin');
    
    if (req.user.role !== 'admin' && !isOwner && !isManagerAdmin) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    club.managers = club.managers.filter(m => m.user.toString() !== req.params.memberId);
    await club.save();

    res.json({ msg: 'Member removed' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;