const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
  title:               { type: String, required: true },
  description:         String,
  detailedDescription: String,
  category:            String,
  date:                { type: Date, required: true },
  venue:               { type: String, required: true },
  club:                { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  clubName:            String,
  status:              { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isReapprovalRequest: { type: Boolean, default: false },
  reapprovalNote:      String,
  facultyNote:         String,
  tags:                [String],
  maxCapacity:         Number,
  rsvpCount:           { type: Number, default: 0 },
  poster:              String,          // Base64 image string
  applicationLink:     String,
  eventHead1: {
    name:    String,
    rollNo:  String,
    contact: String,
  },
  eventHead2: {
    name:    String,
    rollNo:  String,
    contact: String,
  },
}, { timestamps: true });
module.exports = mongoose.model('Event', eventSchema);