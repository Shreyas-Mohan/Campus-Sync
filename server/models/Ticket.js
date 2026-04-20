const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['bug', 'feature_request', 'club_sponsorship', 'other'], default: 'bug' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  adminReply: { type: String }, // Optional reply from the admin/support team
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);