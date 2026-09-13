/**
 * config/db.js — MongoDB connection
 *
 * Uses Mongoose to connect to Atlas.
 * Called once at startup in server.js.
 * Mongoose maintains an internal connection pool,
 * so every model in the app shares this single connection.
 *
 * Why async/await instead of .then()? 
 *   Cleaner error propagation — the caller (server.js) can do:
 *     await connectDB();   // if this throws, startServer() catches it.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in .env');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    throw error;          // Re-throw so server.js can exit gracefully
  }
};

module.exports = connectDB;
