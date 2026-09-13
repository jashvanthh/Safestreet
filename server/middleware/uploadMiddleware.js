/**
 * middleware/uploadMiddleware.js
 *
 * Configures Multer for multipart/form-data file uploads.
 *
 * Strategy:
 *   Primary:  multer-gridfs-storage → stores directly into MongoDB GridFS
 *   Fallback: multer.diskStorage   → stores in /uploads/ (if GridFS blocks progress)
 *
 * Validation (server-side — don't trust MIME type from client):
 *   • Max size: 5 MB
 *   • Allowed types: image/jpeg, image/png, image/webp
 *   • Type validated via `fileFilter`, not extension alone.
 *     (A real production guard also checks magic bytes — see Phase 9 note)
 *
 * Built in Phase 5.
 */

// STUB — implemented in Phase 5
const upload = {
  single: () => (_req, _res, next) => next(),
};

module.exports = upload;
