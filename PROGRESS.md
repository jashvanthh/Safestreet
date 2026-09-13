# SAFE STREET — Progress Tracker

> Paste this file + the master spec at the start of every new AI session.
> Mark phases `[x]` when their Definition of Done (spec Section 14) is met.

## Phases

- [x] **Phase 1** — Setup, Git, architecture
  - [x] Repo initialized (`git init`)
  - [x] `.gitignore`, `.env.example` committed
  - [x] Folder scaffolds created (server + client)
  - [x] `PROGRESS.md` created
  - [ ] First commit pushed to remote (GitHub/GitLab) — push manually: `git remote add origin <url> && git push -u origin main`

- [x] **Phase 2** — Backend + Mongo + Auth
  - [x] `server/` dependencies installed (`express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`, `helmet`)
  - [x] MongoDB Atlas cluster + `MONGO_URI` in `.env`
  - [x] `User` model with `2dsphere` index
  - [x] `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` all tested (curl)
  - [x] JWT auth middleware protecting `/me`
  - [x] Centralized error middleware returning `{ success: false, message }` shape

- [x] **Phase 3** — Incident CRUD + Geospatial
  - [x] `Incident` model with `2dsphere` index on `location`
  - [x] `POST /api/incidents` (no photo yet — add multipart in Phase 5)
  - [x] `GET /api/incidents` with pagination + filters (category, status, from, to, bounds)
  - [x] `GET /api/incidents/nearby` returns correct results for seeded test coords
  - [x] `GET /api/incidents/heatmap` returns `[lat, lng, weight]` array
  - [x] `GET /api/incidents/:id`
  - [x] Anonymous stripping tested (no `reportedBy` in response when `isAnonymous: true`)

- [x] **Phase 4** — React Scaffold + Routing + Auth
  - [x] `client/` created with Vite + React + Tailwind
  - [x] `AuthContext` + `useAuth` hook working
  - [x] `ProtectedRoute` and `AdminRoute` components redirect unauthenticated / non-admin
  - [x] All page components exist (even as stubs)
  - [x] Login / Register pages functional end-to-end

- [x] **Phase 5** — Reporting + Leaflet Picker
  - [x] `IncidentForm` with category, title, description, location picker, photo upload
  - [x] `LocationPicker` (Leaflet click-to-pin + geolocation fallback)
  - [x] Multer + GridFS upload middleware
  - [x] `POST /api/incidents` accepts `multipart/form-data`, stores `photoFileId`
  - [x] `GET /api/files/:fileId` returns image with correct `Content-Type`

- [x] **Phase 6** — Live Map + Heatmap + Filters
  - [x] `MapPage` renders incident pins with popups
  - [x] `HeatmapLayer` renders leaflet.heat layer from `/api/incidents/heatmap`
  - [x] `FilterBar` changes fetch params; data comes from backend not client-side
  - [x] Map viewport `bounds` param used to limit response

- [x] **Phase 7** — Admin Dashboard + Status Workflow
  - [x] `AdminDashboard` page shows aggregation stats (count by category/status)
  - [x] `PATCH /api/incidents/:id/status` requires admin JWT (non-admin gets 403)
  - [x] `AdminRoute` blocks non-admin in React routing
  - [x] Status badge updates reflected in UI

- [x] **Phase 8** — Socket.IO Proximity Notifications
  - [x] `SocketContext` wraps app; socket connects with JWT in handshake
  - [x] Server maps `userId → socket room` on connection
  - [x] Incident creation triggers `$nearSphere` query against `User.notificationLocation`
  - [x] Matched users get `Notification` doc + socket emit
  - [x] `NotificationBell` shows unread count; `Notifications` page lists them
  - [x] Out-of-radius account does NOT receive notification (verified in browser)

- [x] **Phase 9** — GridFS Polish
  - [x] Upload validates: MIME type (magic bytes, not just extension), max 5 MB
  - [x] Retrieval streams correctly, no memory issues
  - [x] Fallback disk storage removed (or kept + documented as deliberate)

- [x] **Phase 10** — Weekly Digest
  - [x] `node-cron` job runs Sunday midnight
  - [x] Digest aggregated per user's `notificationRadius` neighborhood
  - [x] `Digest` document saved to DB
  - [x] Email sent via Nodemailer (or logged if SMTP not configured)
  - [x] `GET /api/digest/latest` returns latest for authenticated user

- [ ] **Phase 11** — Testing + Security + Responsive UI
  - [ ] Jest + Supertest + `mongodb-memory-server` installed
  - [ ] Tests: auth, incident CRUD, geo, admin auth, anonymous hiding, upload validation
  - [ ] All tests pass (`npm test`)
  - [ ] `helmet()` applied on Express
  - [ ] No raw stack traces in API responses
  - [ ] UI usable on 375px mobile viewport

- [ ] **Phase 12** — Deployment + Docs + Presentation
  - [ ] Backend deployed (Render / Railway / Fly.io)
  - [ ] Frontend deployed (Vercel / Netlify)
  - [ ] `MONGO_URI` points to Atlas (not localhost)
  - [ ] End-to-end demo flow rehearsed with seeded accounts
  - [ ] Documentation complete (per Section 13)

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Phase 1 | GridFS for photo storage | Self-contained MongoDB stack; impressive for viva |
| Phase 1 | Monorepo root (`safe-street/`) | Easier relative imports and one `git` repo |
| Phase 1 | Files route is public (no JWT) | `<img src>` tags don't send Authorization headers |
| Phase 1 | Anonymous stripping is server-side | Frontend can't be trusted; field omitted in controller |

---

## Notes / Blockers

*(Add blockers here as you hit them)*
