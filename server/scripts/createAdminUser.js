/**
 * scripts/createAdminUser.js
 *
 * Creates or updates an admin user with specific credentials:
 *   Email:    admin@gmail.com
 *   Password: admin@127
 *   Role:     admin
 */
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const User     = require('../models/User');

const ADMIN_EMAIL    = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin@127';
const ADMIN_NAME     = 'SafeStreet Administrator';

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    let user = await User.findOne({ email: ADMIN_EMAIL });

    if (user) {
      user.name = ADMIN_NAME;
      user.role = 'admin';
      user.passwordHash = ADMIN_PASSWORD; // Pre-save hook will hash it with bcrypt
      await user.save();
      console.log(`✅ Existing user updated to admin: ${ADMIN_EMAIL}`);
    } else {
      user = new User({
        name:                 ADMIN_NAME,
        email:                ADMIN_EMAIL,
        passwordHash:         ADMIN_PASSWORD, // Pre-save hook will hash it
        role:                 'admin',
        notificationLocation: {
          type:        'Point',
          coordinates: [78.4867, 17.3850],
        },
        notificationRadius:   5,
      });
      await user.save();
      console.log(`✅ New admin user created: ${ADMIN_EMAIL}`);
    }

    console.log('\n========================================');
    console.log('ADMIN CREDENTIALS:');
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Role:     admin`);
    console.log('========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
    process.exit(1);
  }
})();
