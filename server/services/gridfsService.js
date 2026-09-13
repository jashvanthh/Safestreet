/**
 * services/gridfsService.js
 *
 * MongoDB GridFS — how it works (viva explanation):
 *
 *   Regular MongoDB documents have a 16MB size limit per document.
 *   Images can easily exceed this. GridFS solves this by splitting files into
 *   255KB chunks and storing them across two collections:
 *     • uploads.files   — file metadata (filename, contentType, size, uploadDate)
 *     • uploads.chunks  — the actual binary data in 255KB pieces
 *
 *   When you "upload" a file, GridFS writes to both collections.
 *   When you "download" a file, GridFS reads the chunks in order and streams them.
 *   We store only the file's _id (photoFileId) on the Incident document.
 *
 * GridFSBucket (native to Mongoose/MongoDB driver):
 *   mongoose.mongo.GridFSBucket is the official API — no extra package needed.
 *   It replaces the deprecated gridfs-stream package.
 *
 * initGridFS() must be called AFTER the DB connection is established in server.js.
 * getGFSBucket() is called in the files route when downloading.
 */

const mongoose = require('mongoose');

let gfsBucket = null;

/**
 * Initialize the GridFS bucket.
 * Call this once after MongoDB connects.
 * bucketName: 'uploads' → creates 'uploads.files' and 'uploads.chunks' collections.
 */
const initGridFS = () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads',
  });
  console.log('✅ GridFS bucket initialized');
};

/**
 * Returns the initialized bucket.
 * Throws if called before initGridFS() — fail fast is better than a cryptic null error.
 */
const getGFSBucket = () => {
  if (!gfsBucket) {
    throw new Error('GridFS bucket not initialized. Call initGridFS() after DB connects.');
  }
  return gfsBucket;
};

/**
 * Delete a file from GridFS by its ObjectId.
 * Used when an incident is deleted — we clean up the orphaned file too.
 * @param {mongoose.Types.ObjectId} fileId
 */
const deleteFile = async (fileId) => {
  const bucket = getGFSBucket();
  await bucket.delete(fileId);
};

module.exports = { initGridFS, getGFSBucket, deleteFile };
