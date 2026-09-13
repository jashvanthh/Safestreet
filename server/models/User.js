/**
 * models/User.js
 *
 * The User schema has two important patterns worth knowing for a viva:
 *
 * 1. PRE-SAVE HOOK (password hashing)
 *    We never store a plaintext password. Before any save, if the password
 *    field changed, we hash it with bcrypt (cost factor 12).
 *    bcrypt is slow BY DESIGN — it makes brute-force attacks expensive.
 *    Cost 12 = ~250ms per hash on average hardware, which is fine for login
 *    but way too slow for an attacker trying millions of guesses.
 *
 * 2. INSTANCE METHOD (comparePassword)
 *    bcrypt.compare() takes the plaintext attempt and the stored hash and
 *    returns true/false. We never decrypt the hash — bcrypt is one-way.
 *
 * 3. 2DSPHERE INDEX on notificationLocation
 *    Required for MongoDB geospatial queries ($near, $nearSphere).
 *    Without this index, those queries throw an error.
 *    Format: GeoJSON Point → coordinates: [longitude, latitude] (lng first!)
 *
 * 4. .select('-passwordHash') pattern
 *    We never send passwordHash in an API response. The select('-passwordHash')
 *    call excludes it from the query result entirely.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,   // Stored in lowercase so 'John@X.com' === 'john@x.com'
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    },

    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,     // NEVER returned by default in any query
    },

    role: {
      type: String,
      enum: ['resident', 'admin'],
      default: 'resident',
    },

    // Where to send proximity notifications — stored as GeoJSON Point
    notificationLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],   // [longitude, latitude] — GeoJSON order!
        default: [0, 0],
      },
    },

    // How far from notificationLocation to receive alerts (in km)
    notificationRadius: {
      type: Number,
      default: 2,
      min: [0.1, 'Radius must be at least 0.1 km'],
      max: [50,  'Radius cannot exceed 50 km'],
    },
  },
  {
    timestamps: true,  // Adds createdAt and updatedAt automatically
  }
);

// ── 2dsphere index — required for $near / $nearSphere queries ────────────────
userSchema.index({ notificationLocation: '2dsphere' });

// ── Pre-save hook: hash password before storing ──────────────────────────────
userSchema.pre('save', async function (next) {
  // 'this' refers to the document being saved
  // Only hash if the passwordHash field was actually modified
  // (prevents re-hashing on unrelated saves like role updates)
  if (!this.isModified('passwordHash')) return next();

  const salt = await bcrypt.genSalt(12);           // Cost factor 12
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// ── Instance method: compare attempted password against stored hash ───────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt.compare handles timing-safe comparison (prevents timing attacks)
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
