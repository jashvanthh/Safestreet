/**
 * middleware/uploadMiddleware.js
 *
 * Multer v2 + Custom GridFS Storage Engine.
 *
 * WHY A CUSTOM ENGINE?
 *   multer-gridfs-storage@5.x only supports multer@^1.4.x and has been
 *   abandoned. multer@2.x fixes 3 HIGH-severity DoS CVEs and introduces
 *   a cleaner storage interface. We implement GridFS storage directly
 *   using the native MongoDB driver's GridFSBucket — no extra package needed.
 *
 * HOW IT WORKS (viva explanation):
 *   1. Client sends POST with Content-Type: multipart/form-data
 *   2. Multer intercepts the request BEFORE the controller runs
 *   3. Our GridFSBucketStorage._handleFile() opens a GridFS upload stream
 *      and pipes the incoming file stream directly into MongoDB — no disk I/O.
 *   4. After upload completes, req.file is populated with:
 *        req.file.id          → the GridFS ObjectId (store as photoFileId)
 *        req.file.filename    → stored filename
 *        req.file.contentType → MIME type
 *        req.file.size        → bytes uploaded
 *   5. req.body still contains all text fields (title, description, etc.)
 *
 * VALIDATION:
 *   fileFilter  — rejects non-image MIME types with 400.
 *   limits.fileSize = 5 MB — multer rejects oversized files automatically.
 *   validateMagicBytes — reads first bytes from GridFS to verify actual format
 *                        (prevents MIME type spoofing).
 */

const multer   = require('multer');
const path     = require('path');
const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE      = 5 * 1024 * 1024;   // 5 MB in bytes
const BUCKET_NAME        = 'uploads';

// ── Custom multer v2 GridFS Storage Engine ────────────────────────────────────
// Implements the _handleFile / _removeFile interface required by multer v2.
class GridFSBucketStorage {
  /**
   * _handleFile is called by multer for every accepted file.
   * We open a GridFS upload stream and pipe the incoming file into it.
   * On success we call cb(null, fileInfo) — multer merges fileInfo into req.file.
   */
  _handleFile(_req, file, cb) {
    const db     = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });

    const filename   = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: file.mimetype,
    });

    file.stream.pipe(uploadStream)
      .on('error', cb)
      .on('finish', () => {
        cb(null, {
          id:          uploadStream.id,     // GridFS ObjectId
          filename:    uploadStream.filename,
          contentType: file.mimetype,
          size:        uploadStream.length,
        });
      });
  }

  /**
   * _removeFile is called by multer if a subsequent middleware throws.
   * We delete the already-uploaded GridFS file to avoid orphaned chunks.
   */
  _removeFile(_req, file, cb) {
    if (!file.id) return cb(null);
    const db     = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });
    bucket.delete(new ObjectId(file.id), cb);
  }
}

// ── File type filter ──────────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);   // Accept
  } else {
    const err = new Error('Only JPEG, PNG, and WEBP images are allowed');
    err.statusCode = 400;
    cb(err, false);   // Reject
  }
};

// ── Configured multer instance ────────────────────────────────────────────────
const upload = multer({
  storage:   new GridFSBucketStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ── Magic byte verification middleware ────────────────────────────────────────
// Reads the first bytes of the stored file from GridFS and verifies the
// actual binary format — prevents MIME type spoofing by a malicious client.
const { verifyFileMagicBytes } = require('../services/gridfsService');

const validateMagicBytes = async (req, res, next) => {
  if (!req.file || !req.file.id) return next();
  try {
    await verifyFileMagicBytes(req.file.id);
    next();
  } catch (err) {
    next(err);
  }
};

upload.validateMagicBytes = validateMagicBytes;
module.exports = upload;
