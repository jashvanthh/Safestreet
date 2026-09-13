/**
 * middleware/uploadMiddleware.js
 *
 * Multer + multer-gridfs-storage pipeline.
 *
 * HOW THIS WORKS (viva explanation):
 *   1. Client sends a POST with Content-Type: multipart/form-data
 *   2. Multer intercepts the request BEFORE the controller runs
 *   3. multer-gridfs-storage streams the file directly into MongoDB GridFS
 *      (no temporary file on disk — it goes straight to the DB)
 *   4. After Multer finishes, req.file is populated with GridFS metadata:
 *        req.file.id          → the GridFS _id (store this as photoFileId)
 *        req.file.filename    → stored filename
 *        req.file.contentType → MIME type
 *        req.file.size        → bytes
 *   5. req.body still has all the text fields (title, description, etc.)
 *
 * VALIDATION:
 *   fileFilter checks file.mimetype — rejects non-image files with a 400.
 *   limits.fileSize = 5MB — Multer rejects oversized files automatically.
 *   NOTE: mimetype can be spoofed by a client. Phase 9 adds magic byte checking
 *   (reading the first few bytes of the file to verify the actual format).
 *
 * FALLBACK: If multer-gridfs-storage causes issues during development,
 *   temporarily switch to DISK_STORAGE below and come back to GridFS in Phase 9.
 */

const multer       = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const path         = require('path');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE      = 5 * 1024 * 1024;   // 5 MB in bytes

// ── GridFS storage (primary) ──────────────────────────────────────────────────
const gridFsStorage = new GridFsStorage({
  url:     process.env.MONGO_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (_req, file) => ({
    bucketName: 'uploads',
    // Generate a unique filename to avoid collisions
    filename: `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`,
  }),
});

// ── Disk storage (fallback — uncomment if GridFS is blocking you) ─────────────
// const diskStorage = multer.diskStorage({
//   destination: 'uploads/',
//   filename: (_req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`);
//   },
// });

// ── File type filter ──────────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);    // Accept
  } else {
    const err = new Error('Only JPEG, PNG, and WEBP images are allowed');
    err.statusCode = 400;
    cb(err, false);    // Reject
  }
};

// ── Configured Multer instance ────────────────────────────────────────────────
const upload = multer({
  storage:    gridFsStorage,       // Swap to diskStorage if needed
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ── Phase 9: Magic byte verification middleware ──────────────────────────────
const { verifyFileMagicBytes } = require('../services/gridfsService');

const validateMagicBytes = async (req, res, next) => {
  if (!req.file || !req.file.id) {
    return next();
  }
  try {
    await verifyFileMagicBytes(req.file.id);
    next();
  } catch (err) {
    next(err);
  }
};

upload.validateMagicBytes = validateMagicBytes;
module.exports = upload;

