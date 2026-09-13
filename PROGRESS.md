# SAFE STREET — Progress Tracker

> Paste this file + the master spec at the start of every new AI session.
> Mark phases `[x]` when their Definition of Done (spec Section 14) is met.

## Phases

- [ ] **Phase 1** — Setup, Git, architecture
  - [x] Repo initialized (`git init`)
  - [x] `.gitignore`, `.env.example` committed
  - [x] Folder scaffolds created (server + client)
  - [x] `PROGRESS.md` created
  - [ ] First commit pushed to remote (GitHub/GitLab)

- [ ] **Phase 2** — Backend + Mongo + Auth
  - [ ] `server/` dependencies installed (`express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`, `helmet`)
  - [ ] MongoDB Atlas cluster + `MONGO_URI` in `.env`
  - [ ] `User` model with `2dsphere` index
  - [ ] `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` all tested in Postman
  - [ ] JWT auth middleware protecting `/me`
  - [ ] Centralized error middleware returning `{ success: false, message }` shape

- [ ] **Phase 3** — Incident CRUD + Geospatial
  - [ ] `Incident` model with `2dsphere` index on `location`
  - [ ] `POST /api/incidents` (no photo yet — add multipart in Phase 5)
  - [ ] `GET /api/incidents` with pagination + filters
  - [ ] `GET /api/incidents/nearby` returns correct results for seeded test coords
  - [ ] `GET /api/incidents/heatmap` returns `[lat, lng, weight]` array
  - [ ] `GET /api/incidents/:id`
  - [ ] Anonymous stripping tested (no `reportedBy` in response when `isAnonymous: true`)

- [ ] **Phase 4** — React Scaffold + Routing + Auth
  - [ ] `client/` created with Vite + React + Tailwind
  - [ ] `AuthContext` + `useAuth` hook working
  - [ ] `ProtectedRoute` and `AdminRoute` components redirect unauthenticated / non-admin
  - [ ] All page components exist (even as stubs)
  - [ ] Login / Register pages functional end-to-end

- [ ] **Phase 5** — Reporting + Leaflet Picker
  - [ ] `IncidentForm` with category, title, description, location picker, photo upload
  - [ ] `LocationPicker` (Leaflet click-to-pin + geolocation fallback)
  - [ ] Multer + GridFS upload middleware
  - [ ] `POST /api/incidents` accepts `multipart/form-data`, stores `photoFileId`
  - [ ] `GET /api/files/:fileId` returns image with correct `Content-Type`

- [ ] **Phase 6** — Live Map + Heatmap + Filters
  - [ ] `MapView` renders incident pins with popups
  - [ ] `HeatmapLayer` renders leaflet.heat layer from `/api/incidents/heatmap`
  - [ ] `FilterBar` changes fetch params; data comes from backend not client-side
  - [ ] Map viewport `bounds` param used to limit response

- [ ] **Phase 7** — Admin Dashboard + Status Workflow
  - [ ] `AdminDashboard` page shows aggregation stats (count by category/status)
  - [ ] `PATCH /api/incidents/:id/status` requires admin JWT (non-admin gets 403)
  - [ ] `AdminRoute` blocks non-admin in React routing
  - [ ] Status badge updates reflected in UI

- [ ] **Phase 8** — Socket.IO Proximity Notifications
  - [ ] `SocketContext` wraps app; socket connects with JWT in handshake
  - [ ] Server maps `userId → socket room` on connection
  - [ ] Incident creation triggers `$nearSphere` query against `User.notificationLocation`
  - [ ] Matched users get `Notification` doc + socket emit
  - [ ] `NotificationBell` shows unread count; `Notifications` page lists them
  - [ ] Out-of-radius account does NOT receive notification (verified in browser)

- [ ] **Phase 9** — GridFS Polish
  - [ ] Upload validates: MIME type (magic bytes, not just extension), max 5 MB
  - [ ] Retrieval streams correctly, no memory issues
  - [ ] Fallback disk storage removed (or kept + documented as deliberate)

- [ ] **Phase 10** — Weekly Digest
  - [ ] `node-cron` job runs Sunday midnight
  - [ ] Digest aggregated per user's `notificationRadius` neighborhood
  - [ ] `Digest` document saved to DB
  - [ ] Email sent via Nodemailer (or logged if SMTP not configured)
  - [ ] `GET /api/digest/latest` returns latest for authenticated user

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
