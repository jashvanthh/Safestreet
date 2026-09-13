/**
 * __tests__/api.test.js
 *
 * Phase 11 — End-to-end Integration Test Suite
 *
 * Tests:
 *   1. Security & Healthcheck (Helmet headers, 200 health status)
 *   2. Auth: Register -> Login -> /me -> /profile update
 *   3. Incident CRUD & Geospatial:
 *      - Create incident with GeoJSON coordinates
 *      - Strip reporter identity when isAnonymous === true
 *      - Nearby incident query using $nearSphere
 *   4. Admin Protection & Workflow:
 *      - Resident forbidden (403) from updating status
 *      - Admin permitted (200) to update status to 'under_review' / 'resolved'
 *   5. Weekly Safety Digest:
 *      - Generate on-demand digest (/api/digest/generate)
 *      - Fetch latest digest (/api/digest/latest)
 *   6. Centralized Error Handling:
 *      - 400 on validation errors
 *      - Consistent { success: false, message } response envelope
 */

require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Incident = require('../models/Incident');
const { initGridFS } = require('../services/gridfsService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  initGridFS();

  // Ensure 2dsphere indexes are built in the in-memory MongoDB
  await User.init();
  await Incident.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 11: Comprehensive SafeStreet Integration Tests', () => {
  let residentToken = '';
  let residentId    = '';
  let adminToken    = '';
  let testIncidentId = '';

  // ── 1. Security & Health ───────────────────────────────────────────────────
  describe('1. System Health & Security Headers', () => {
    it('should return 200 and success status on /health', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should apply Helmet security headers', async () => {
      const res = await request(app).get('/health');
      expect(res.headers).toHaveProperty('x-dns-prefetch-control');
      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
    });
  });

  // ── 2. Auth Flow ───────────────────────────────────────────────────────────
  describe('2. Authentication & Profile Flow', () => {
    it('should register a new resident user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name:     'Jane Doe',
          email:    'jane@safestreet.test',
          password: 'Password123!',
          role:     'resident',
          notificationRadius: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@safestreet.test');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      residentId = res.body.data.user._id;
    });

    it('should login and return a JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email:    'jane@safestreet.test',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      residentToken = res.body.data.token;
    });

    it('should access protected /api/auth/me with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Jane Doe');
    });

    it('should update user notification location and radius via PATCH /api/auth/profile', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          notificationLocation: {
            type:        'Point',
            coordinates: [72.8777, 19.0760], // Mumbai [lng, lat]
          },
          notificationRadius: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.notificationRadius).toBe(5);
      expect(res.body.data.user.notificationLocation.coordinates).toEqual([72.8777, 19.0760]);
    });
  });

  // ── 3. Incident Reporting & Anonymous Stripping ────────────────────────────
  describe('3. Incident Reporting & Geospatial API', () => {
    it('should create an incident with anonymous reporting and strip reporter identity', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          title:       'Broken streetlight near Central Park',
          description: 'Dark alleyway with zero visibility at night.',
          category:    'poor_lighting',
          lat:         19.0762,
          lng:         72.8779,
          isAnonymous: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.incident.title).toBe('Broken streetlight near Central Park');
      // Server-side anonymous stripping check:
      expect(res.body.data.incident).not.toHaveProperty('reportedBy');
      expect(res.body.data.incident).not.toHaveProperty('reporterContact');
      testIncidentId = res.body.data.incident._id;
    });

    it('should query nearby incidents within 5km radius', async () => {
      const res = await request(app)
        .get('/api/incidents/nearby?lat=19.0760&lng=72.8777&radius=5')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.incidents)).toBe(true);
      expect(res.body.data.incidents.length).toBeGreaterThanOrEqual(1);
    });

    it('should return heatmap data points [lat, lng, weight]', async () => {
      const res = await request(app)
        .get('/api/incidents/heatmap')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.points)).toBe(true);
      expect(res.body.data.points[0]).toHaveLength(3); // [lat, lng, weight]
    });
  });

  // ── 4. Admin Role & Workflow Protection ────────────────────────────────────
  describe('4. Role-based Access Control (RBAC) & Status Updates', () => {
    beforeAll(async () => {
      // Create admin account — pre-save hook will hash passwordHash automatically
      const adminUser = new User({
        name:         'Admin Supervisor',
        email:        'admin@safestreet.test',
        passwordHash: 'AdminPassword123!',
        role:         'admin',
      });
      await adminUser.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email:    'admin@safestreet.test',
          password: 'AdminPassword123!',
        });
      adminToken = res.body.data.token;
    });

    it('should forbid resident from changing incident status (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/incidents/${testIncidentId}/status`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ status: 'under_review' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to change incident status (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/incidents/${testIncidentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'under_review' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.incident.status).toBe('under_review');
    });
  });

  // ── 5. Weekly Digest Flow ──────────────────────────────────────────────────
  describe('5. Weekly Safety Digest Generation', () => {
    it('should generate a weekly digest on demand for the user', async () => {
      const res = await request(app)
        .post('/api/digest/generate')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.digest).toHaveProperty('totalIncidents');
      expect(res.body.data.digest).toHaveProperty('trend');
      expect(res.body.data.digest).toHaveProperty('categorySummary');
    });

    it('should retrieve latest safety digest for authenticated resident', async () => {
      const res = await request(app)
        .get('/api/digest/latest')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.digest).not.toBeNull();
    });
  });

  // ── 6. Centralized Error Handling ──────────────────────────────────────────
  describe('6. Error Middleware & Envelope Validation', () => {
    it('should return 400 Bad Request when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ title: '' }); // Missing required fields

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(typeof res.body.message).toBe('string');
    });

    it('should return 401 Unauthorized when request lacks a valid token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
