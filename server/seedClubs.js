require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Club = require('./models/Club'); // Adjust path if needed

// Add your 10-15 official clubs here
const clubsToSeed = [
  { name: 'Manchtantra', email: 'manchtantra@iiitm.ac.in', password: 'password123' },
  { name: 'AASF', email: 'aasf@iiitm.ac.in', password: 'password123' },
  { name: 'E-Cell', email: 'ecell@iiitm.ac.in', password: 'password123' },
  { name: 'IEEE Student Branch', email: 'ieeestudentbranch@iiitm.ac.in', password: 'password123' },
  { name: 'IEEE', email: 'ieee@iiitm.ac.in', password: 'password123' },
  { name: 'GDSC', email: 'gdsc@iiitm.ac.in', password: 'password123' },
  { name: 'Uthaan', email: 'uthaan@iiitm.ac.in', password: 'password123' },
  { name: 'SAC', email: 'sac@iiitm.ac.in', password: 'password123' },
  { name: 'Hindi Samiti', email: 'hindisamiti@iiitm.ac.in', password: 'password123' },
  { name: 'Aurora', email: 'aurora@iiitm.ac.in', password: 'password123' },
  { name: 'Infotsav', email: 'infotsav@iiitm.ac.in', password: 'password123' },
  { name: 'Urja', email: 'urja@iiitm.ac.in', password: 'password123' },
  { name: 'SGM', email: 'sgm@iiitm.ac.in', password: 'password123' },
  { name: 'Rotaract', email: 'rotaract@iiitm.ac.in', password: 'password123' }
];

async function seedClubs() {
  try {
    console.log('Connecting to MongoDB...');
    // Connect to the DB using your .env URI
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB!');

    for (const clubData of clubsToSeed) {
      // 1. Check if club already exists so we don't duplicate
      const existing = await Club.findOne({ email: clubData.email });
      if (existing) {
        console.log(`⚠️ Club ${clubData.email} already exists. Skipping.`);
        continue;
      }

      // 2. Securely hash the password!
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(clubData.password, salt);

      const slug = clubData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // 3. Create and save the club to the database
      const newClub = new Club({
        name: clubData.name,
        email: clubData.email,
        password: hashedPassword,
        slug: slug,
        isVerified: true // Since these are official, we can auto-verify them!
      });

      await newClub.save();
      console.log(`✅ Successfully seeded: ${clubData.name} (${clubData.email})`);
    }

    console.log('\n🎉 All clubs seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding clubs:', error);
    process.exit(1);
  }
}

seedClubs();
