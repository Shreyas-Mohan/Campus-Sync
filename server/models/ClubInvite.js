const mongoose = require('mongoose');

const ClubInviteSchema = new mongoose.Schema({
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor', 'event_manager'], default: 'event_manager' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('ClubInvite', ClubInviteSchema);