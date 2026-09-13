/**
 * scripts/makeAdmin.js
 *
 * One-time script to promote a user to admin role.
 * Run from the server/ directory:
 *   node scripts/makeAdmin.js resident@test.com
 *
 * Usage: node scripts/makeAdmin.js <email>
 *
 * This is needed because the register endpoint always creates 'resident' role.
 * In production, admin promotion should be done by another admin through a
 * secure interface — never by a public endpoint.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/makeAdmin.js <email>');
  process.exit(1);
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.error(`❌ No user found with email: ${email}`);
  } else {
    console.log(`✅ ${user.name} (${user.email}) is now an admin`);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => { console.error(err); process.exit(1); });
