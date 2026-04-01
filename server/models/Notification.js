const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['comment', 'event_update', 'new_event'], required: true },
  message:     { type: String, required: true },
  eventId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  eventTitle:  String,
  fromName:    String,
  read:        { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
