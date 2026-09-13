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

/**
 * Phase 9: Verify image magic bytes from the first GridFS chunk.
 * Prevents file-extension spoofing (e.g. executable/script disguised as .png/.jpg).
 * If invalid, purges the uploaded file immediately and throws a 400 error.
 *
 * Magic Byte signatures:
 *   JPEG: FF D8 FF
 *   PNG:  89 50 4E 47 0D 0A 1A 0A
 *   WEBP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
 *
 * @param {mongoose.Types.ObjectId} fileId
 */
const verifyFileMagicBytes = async (fileId) => {
  const db = mongoose.connection.db;
  const chunk = await db.collection('uploads.chunks').findOne({ files_id: fileId, n: 0 });

  if (!chunk || !chunk.data) {
    await deleteFile(fileId).catch(() => {});
    const err = new Error('Corrupted or empty file upload');
    err.statusCode = 400;
    throw err;
  }

  const buf = chunk.data.buffer || chunk.data;

  // JPEG signature: FF D8 FF
  const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
    buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;

  // WebP signature: 'RIFF' at 0..3 and 'WEBP' at 8..11
  const isWebp =
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;

  if (!isJpeg && !isPng && !isWebp) {
    // Purge the spoofed file so it doesn't waste GridFS space
    await deleteFile(fileId).catch(() => {});
    const err = new Error('File validation failed: File content does not match allowed image formats (JPEG, PNG, WEBP)');
    err.statusCode = 400;
    throw err;
  }

  return true;
};

module.exports = { initGridFS, getGFSBucket, deleteFile, verifyFileMagicBytes };

