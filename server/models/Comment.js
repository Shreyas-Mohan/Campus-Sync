const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, default: 'student' },
  text:       { type: String, required: true },
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  event:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, default: 'student' },
  text:       { type: String, required: true },
  replies:    [replySchema],
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
