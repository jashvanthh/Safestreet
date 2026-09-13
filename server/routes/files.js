/**
 * routes/files.js
 *
 * Serves images stored in MongoDB GridFS.
 *
 * WHY THIS ROUTE EXISTS:
 *   Files are stored as binary chunks in MongoDB (GridFS), not on disk.
 *   A browser <img src="..."> tag needs a URL that returns raw image bytes.
 *   This route reads from GridFS and streams the bytes with the correct
 *   Content-Type header so the browser renders the image.
 *
 * WHY PUBLIC (no JWT required):
 *   <img src="/api/files/abc123"> in the browser cannot send an
 *   Authorization header. Making this route public is the standard solution.
 *   This is a documented design decision (see PROGRESS.md Key Decisions Log).
 *   For sensitive images you'd use signed URLs — overkill for this PBL.
 *
 * STREAMING vs LOADING INTO MEMORY:
 *   bucket.openDownloadStream() returns a Node.js Readable stream.
 *   stream.pipe(res) sends the bytes chunk by chunk — the whole file
 *   is NEVER loaded into memory at once. This is the correct pattern
 *   for serving binary files from Node.js.
 */

const express   = require('express');
const router    = express.Router();
const mongoose  = require('mongoose');
const { getGFSBucket } = require('../services/gridfsService');

// GET /api/files/:fileId — stream image from GridFS
router.get('/:fileId', async (req, res, next) => {
  try {
    // ── Validate ObjectId format ───────────────────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      const err = new Error('Invalid file ID'); err.statusCode = 400; return next(err);
    }

    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const bucket = getGFSBucket();

    // ── Check file exists in GridFS ────────────────────────────────────────
    // bucket.find() returns a cursor — we convert to array to check existence
    const files = await bucket.find({ _id: fileId }).toArray();

    if (!files || files.length === 0) {
      const err = new Error('File not found'); err.statusCode = 404; return next(err);
    }

    const file = files[0];

    // ── Set response headers ───────────────────────────────────────────────
    res.set('Content-Type',   file.contentType || 'image/jpeg');
    res.set('Content-Length', file.length);
    // Cache for 1 hour in browser — images don't change after upload
    res.set('Cache-Control',  'public, max-age=3600');

    // ── Stream the file ────────────────────────────────────────────────────
    // openDownloadStream returns a Readable — pipe it to the response
    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('error', (err) => {
      // Stream error (e.g. chunk missing) — pass to Express error handler
      next(err);
    });

    downloadStream.pipe(res);   // This is the correct pattern — never Buffer.concat()

  } catch (err) {
    next(err);
  }
});

module.exports = router;
