const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  slug: { type: String, unique: true },
  
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  logo: { type: String, default: '' },
  
  isVerified: { type: Boolean, default: false },
  isRecruiting: { type: Boolean, default: false },
  
  coreTeam: [{
    title: { type: String }, // e.g., "President", "Tech Lead"
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String }
  }],
  
  socialLinks: {
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Club', ClubSchema);
