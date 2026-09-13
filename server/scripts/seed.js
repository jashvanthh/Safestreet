/**
 * scripts/seed.js — Phase 11 / 12
 *
 * Populates MongoDB Atlas with demo accounts and localized sample incidents.
 * Run with: npm run seed
 *
 * Accounts created:
 *   - Admin:    admin@safestreet.com    / AdminPassword123!
 *   - Resident: aarav@safestreet.com    / Password123!
 *   - Resident: ananya@safestreet.com   / Password123!
 */

require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const User     = require('../models/User');
const Incident = require('../models/Incident');

const SAMPLE_INCIDENTS = [
  {
    title:       'Non-functioning streetlights along SV Road',
    description: 'A 200m stretch has zero illumination, posing a hazard for pedestrians and two-wheelers.',
    category:    'poor_lighting',
    location:    { type: 'Point', coordinates: [72.8402, 19.0553] },
    status:      'reported',
    isAnonymous: false,
  },
  {
    title:       'Blind turn collision risk at Linking Road crossing',
    description: 'No convex mirror or traffic light; multiple near-misses observed during evening rush hour.',
    category:    'unsafe_intersection',
    location:    { type: 'Point', coordinates: [72.8335, 19.0628] },
    status:      'under_review',
    isAnonymous: false,
  },
  {
    title:       'Verbal harassment reported near railway overbridge',
    description: 'Group loitering near the stairwell after 9 PM, passing derogatory remarks to commuters.',
    category:    'harassment',
    location:    { type: 'Point', coordinates: [72.8441, 19.0195] },
    status:      'reported',
    isAnonymous: true,
  },
  {
    title:       'Unmarked deep trench across pedestrian footpath',
    description: 'Excavation left uncovered without safety barricades or caution tape.',
    category:    'other',
    location:    { type: 'Point', coordinates: [72.8489, 19.0162] },
    status:      'resolved',
    isAnonymous: false,
  },
  {
    title:       'Suspicious vehicle parked without number plates for 3 days',
    description: 'Dark-tinted van stationed opposite the residential park entrance.',
    category:    'suspicious_activity',
    location:    { type: 'Point', coordinates: [72.8361, 19.0664] },
    status:      'under_review',
    isAnonymous: false,
  },
  {
    title:       'Flickering high-mast lamp at Dadar TT circle',
    description: 'High-voltage lamp flickers violently creating strobe hazards for night drivers.',
    category:    'poor_lighting',
    location:    { type: 'Point', coordinates: [72.8465, 19.0189] },
    status:      'reported',
    isAnonymous: false,
  },
  {
    title:       'Speeding vehicles ignoring pedestrian zebra crossing',
    description: 'Heavy vehicles exceed 60 km/h in school zone with no speed breakers.',
    category:    'unsafe_intersection',
    location:    { type: 'Point', coordinates: [72.8378, 19.0542] },
    status:      'under_review',
    isAnonymous: false,
  },
  {
    title:       'Stalking incident reported outside convenience store',
    description: 'Individual followed complainant for three blocks before being confronted by passersby.',
    category:    'harassment',
    location:    { type: 'Point', coordinates: [72.8415, 19.0221] },
    status:      'reported',
    isAnonymous: true,
  },
  {
    title:       'Waterlogging and exposed electric cables after rain',
    description: 'Submerged junction box leaking current into puddle on sidewalk.',
    category:    'other',
    location:    { type: 'Point', coordinates: [72.8350, 19.0601] },
    status:      'resolved',
    isAnonymous: false,
  },
  {
    title:       'Broken security gate allowing unauthorized access to lane',
    description: 'Bypass passage left wide open at night leading to petty vandalism.',
    category:    'suspicious_activity',
    location:    { type: 'Point', coordinates: [72.8452, 19.0170] },
    status:      'reported',
    isAnonymous: false,
  },
];

async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');

    // Create or update admin user
    let admin = await User.findOne({ email: 'admin@safestreet.com' });
    if (!admin) {
      admin = new User({
        name:                 'Supervisor Admin',
        email:                'admin@safestreet.com',
        passwordHash:         'AdminPassword123!',
        role:                 'admin',
        notificationLocation: { type: 'Point', coordinates: [72.8427, 19.0178] },
        notificationRadius:   10,
      });
      await admin.save();
      console.log('👤 Admin user created: admin@safestreet.com / AdminPassword123!');
    } else {
      console.log('👤 Admin user exists: admin@safestreet.com');
    }

    // Create or update resident 1
    let resident1 = await User.findOne({ email: 'aarav@safestreet.com' });
    if (!resident1) {
      resident1 = new User({
        name:                 'Aarav Sharma',
        email:                'aarav@safestreet.com',
        passwordHash:         'Password123!',
        role:                 'resident',
        notificationLocation: { type: 'Point', coordinates: [72.8427, 19.0178] },
        notificationRadius:   3,
      });
      await resident1.save();
      console.log('👤 Resident 1 created: aarav@safestreet.com / Password123!');
    }

    // Create or update resident 2
    let resident2 = await User.findOne({ email: 'ananya@safestreet.com' });
    if (!resident2) {
      resident2 = new User({
        name:                 'Ananya Patel',
        email:                'ananya@safestreet.com',
        passwordHash:         'Password123!',
        role:                 'resident',
        notificationLocation: { type: 'Point', coordinates: [72.8397, 19.0596] },
        notificationRadius:   4,
      });
      await resident2.save();
      console.log('👤 Resident 2 created: ananya@safestreet.com / Password123!');
    }

    // Seed sample incidents if fewer than 5 incidents exist
    const count = await Incident.countDocuments();
    if (count < 5) {
      console.log('📍 Seeding sample incidents...');
      for (let i = 0; i < SAMPLE_INCIDENTS.length; i++) {
        const item = SAMPLE_INCIDENTS[i];
        await Incident.create({
          ...item,
          reportedBy: (i % 2 === 0 ? resident1._id : resident2._id),
        });
      }
      console.log(`✅ Seeded ${SAMPLE_INCIDENTS.length} sample incidents across Mumbai`);
    } else {
      console.log(`ℹ️ Database already has ${count} incidents — skipping incident seed`);
    }

    console.log('\n🎉 Database seeding finished successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
