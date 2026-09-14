/**
 * scripts/createAdmin.js
 * Creates or updates the admin account for jashvanth542@gmail.com
 * Run: node scripts/createAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');

const ADMIN_EMAIL    = 'jashvanth542@gmail.com';
const ADMIN_PASSWORD = 'safestreet$_A1';
const ADMIN_NAME     = 'Jashvanth Admin';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  let user = await User.findOne({ email: ADMIN_EMAIL }).select('+passwordHash');

  if (user) {
    // Update existing account
    user.name                 = ADMIN_NAME;
    user.role                 = 'admin';
    user.passwordHash         = ADMIN_PASSWORD;   // pre-save hook will bcrypt this
    user.notificationRadius   = 10;
    user.notificationLocation = { type: 'Point', coordinates: [77.5946, 12.9716] };
    await user.save();
    console.log('✅ Existing account updated to admin');
  } else {
    // Create fresh admin account
    user = new User({
      name:                 ADMIN_NAME,
      email:                ADMIN_EMAIL,
      passwordHash:         ADMIN_PASSWORD,   // pre-save hook will bcrypt this
      role:                 'admin',
      notificationLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      notificationRadius:   10,
    });
    await user.save();
    console.log('✅ New admin account created');
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin Login Credentials');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Email   :', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);
  console.log('  Role    :', user.role);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
