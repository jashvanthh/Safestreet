# 🛡️ SafeStreet — Neighborhood Safety & Incident Reporting Platform

[![CI / Tests](https://img.shields.io/badge/Tests-15%20Passing-emerald?style=flat-square&logo=jest)](https://jestjs.io/)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue?style=flat-square&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2B%20GridFS-forestgreen?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-black?style=flat-square&logo=socket.io)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

SafeStreet is a full-stack, hyper-local community safety platform built with the MERN stack, Socket.IO, and MongoDB geospatial indexes. It enables residents to report local hazards, track neighborhood incident hotspots, receive real-time proximity alerts, and review weekly safety digests.

---

## 📑 Table of Contents
- [Architecture & Design](#-architecture--design)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Demo Accounts](#-demo-accounts)
- [API Reference](#-api-reference)
- [Automated Testing](#-automated-testing)
- [Key Engineering Decisions](#-key-engineering-decisions)

---

## 🏛 Architecture & Design

```
Browser (React 19 + Vite + Tailwind)
       │
       │  HTTP (REST API / Multipart)       WebSocket (Socket.IO)
       ▼                                               ▼
  Express Server (Node.js) ◄────────────────────► Socket.IO Server
       │
  Middleware Pipeline:
  Helmet ➔ CORS ➔ JSON / Multer ➔ JWT Auth ➔ RBAC ➔ Route ➔ Error Handler
       │
  Controllers (Thin orchestration)
       │
  Services Layer:
  ├─ notificationService (Socket rooms + Haversine proximity fan-out)
  ├─ geoService          (MongoDB 2dsphere $nearSphere & $geoWithin)
  ├─ gridfsService       (Streaming upload/download + magic bytes check)
  └─ digestService       (Weekly statistical aggregation + email dispatch)
       │
  Mongoose Models:
  User, Incident, Notification, Digest
       │
  MongoDB Atlas:
  ├─ 2dsphere Geospatial Indexes
  └─ GridFS Binary Buckets (uploads.files, uploads.chunks)
```

---

## ✨ Key Features

### 1. 📍 Geospatial Incident Reporting & Interactive Maps
- **Click-to-Pin Location**: Interactive Leaflet map with GPS geolocation fallback for pinpointing hazards.
- **2dsphere Querying**: Incidents stored as GeoJSON `Point` coordinates `[longitude, latitude]` and indexed with MongoDB `2dsphere`.
- **Live Heatmap Layer**: Visual intensity representation of neighborhood hazard clusters using `leaflet.heat`.
- **Dynamic Bounding Box**: Viewport-limited querying (`bounds`) for performance when panning the map.

### 2. 🔔 Real-Time Proximity Notifications (Socket.IO)
- **JWT-Protected Handshake**: WebSockets authenticate using user JWT tokens in `io.use` middleware.
- **User-Specific Rooms**: Each resident joins their own private room (`userId`) supporting multiple concurrent tabs/devices.
- **Haversine Distance Matching**: When an incident is posted, SafeStreet finds residents whose custom alert radius covers the hazard location and broadcasts immediate notifications.
- **Dual Persistence**: Stored persistently in MongoDB for offline users and emitted over WebSocket for online users.
- **Automatic Sync**: New and existing reports within a resident's radius automatically populate in their notification history.

### 3. 🖼️ MongoDB GridFS Media Storage with Magic Byte Validation
- **Direct Database Chunking**: Images stream into MongoDB GridFS in 255KB binary chunks (`uploads.files`, `uploads.chunks`).
- **Binary Signature Validation**: Verifies genuine file signatures (**JPEG**: `FF D8 FF`, **PNG**: `89 50 4E 47 0D 0A 1A 0A`, **WebP**: `RIFF...WEBP`) rather than relying on spoofable MIME headers. Malicious files are automatically purged from GridFS.
- **Public Streaming**: Images stream via `GET /api/files/:fileId` with caching headers for `<img src="...">` tags without exposing tokens.

### 4. 📊 Weekly Neighborhood Safety Digest & Cron
- **Automated Sunday Midnight Cron**: Scheduled background job via `node-cron` (`0 0 * * 0`).
- **Trend Analytics**: Calculates week-over-week trends (`up`, `down`, `stable`) within each resident's alert zone.
- **Category Breakdown**: Aggregates counts by category (poor lighting, harassment, intersections, etc.).
- **On-Demand Generation**: Instant `POST /api/digest/generate` trigger from the UI to preview latest statistics.
- **Email Dispatch**: Dispatches clean HTML emails via Nodemailer (or logs safely when SMTP is unconfigured).

### 5. 🛡️ Role-Based Access Control (RBAC) & Incident Moderation
- **Resident vs Admin**: Residents report issues and update personal zones; Admins access the `/admin` dashboard.
- **Lifecycle Status Workflow**: Incidents transition through `reported` ➔ `under_review` ➔ `resolved`.
- **Server-Side Anonymous Stripping**: When `isAnonymous: true`, reporter identity is permanently stripped by server controllers.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v6, Leaflet, React-Leaflet, Socket.IO Client, Axios |
| **Backend** | Node.js, Express.js, Socket.IO, Multer, Multer-GridFS-Storage, Node-Cron, Nodemailer |
| **Database** | MongoDB Atlas, Mongoose, GridFS (`2dsphere` indexes) |
| **Security** | Helmet, JWT (JSON Web Tokens), Bcrypt.js (12 salt rounds), CORS, Input Sanitization |
| **Testing** | Jest, Supertest, MongoMemoryServer |

---

## 📂 Repository Structure

```
safe-street/
├── client/                     # Frontend Application (React + Vite)
│   ├── public/                 # Static assets & logo
│   ├── src/
│   │   ├── components/         # Navbar, LocationPicker, NotificationBell, ProtectedRoute, etc.
│   │   ├── context/            # AuthContext (global state) & SocketContext (real-time events)
│   │   ├── hooks/              # Custom hooks: useAuth, useIncidents, useGeolocation
│   │   ├── pages/              # Home, Login, Register, MapPage, ReportIncident, Digest, Profile, Admin
│   │   ├── services/           # Axios API instance with JWT interceptors
│   │   ├── utils/              # Constants, helpers, validators
│   │   ├── App.jsx             # Route definitions & guards
│   │   └── main.jsx            # React root mount
│   ├── index.html
│   ├── vite.config.js          # Vite configuration & proxy routes
│   └── package.json
│
├── server/                     # Backend API & WebSocket Server (Express)
│   ├── config/                 # Database connection with DNS resolver configuration
│   ├── controllers/            # authController, incidentController, notificationController, digestController
│   ├── jobs/                   # weeklyDigestJob (node-cron schedule)
│   ├── middleware/             # authMiddleware, adminMiddleware, uploadMiddleware, errorMiddleware
│   ├── models/                 # Mongoose schemas: User, Incident, Notification, Digest
│   ├── routes/                 # Express API routes
│   ├── scripts/                # Database seed script (npm run seed)
│   ├── services/               # geoService, notificationService, gridfsService, digestService
│   ├── utils/                  # Token generator, validation rules
│   ├── __tests__/              # Integration test suite (Supertest + MongoMemoryServer)
│   ├── app.js                  # Express app factory (testable without listening)
│   ├── server.js               # Server entry point (starts HTTP, Socket.IO, Cron, & Port)
│   └── package.json
│
├── PROGRESS.md                 # 12-Phase development tracking document
├── .env.example                # Template for environment configuration
└── README.md                   # Comprehensive project documentation
```

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/jashvanthh/Safestreet.git
cd Safestreet
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env     # Fill in MONGO_URI and JWT_SECRET
npm run dev              # Starts nodemon server on http://localhost:5001
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev              # Starts Vite client on http://localhost:5173
```

---

## 🔐 Environment Variables

Create `server/.env` with the following variables:

```env
# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/safe-street?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_strong_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5001
NODE_ENV=development

# CORS Configuration
CLIENT_ORIGIN=http://localhost:5173

# Optional: Nodemailer SMTP (Logs to console if blank)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

---

## 👥 Demo Accounts

Run the seed script to populate demo users and sample Mumbai incidents:
```bash
cd server
npm run seed
```

| Role | Email | Password | Default Alert Location |
|---|---|---|---|
| **Admin** | `admin@safestreet.com` | `AdminPassword123!` | Dadar, Mumbai (10 km radius) |
| **Resident** | `aarav@safestreet.com` | `Password123!` | Dadar, Mumbai (3 km radius) |
| **Resident** | `ananya@safestreet.com` | `Password123!` | Bandra, Mumbai (4 km radius) |

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new resident account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT |
| `GET` | `/api/auth/me` | JWT | Get authenticated profile |
| `PATCH`| `/api/auth/profile` | JWT | Update notification location & alert radius |
| `POST` | `/api/incidents` | JWT | Report an incident (Multipart image upload) |
| `GET` | `/api/incidents` | JWT | List incidents with filters & pagination |
| `GET` | `/api/incidents/nearby`| JWT | Geospatial search (`?lat=&lng=&radius=`) |
| `GET` | `/api/incidents/heatmap`| JWT | Return `[lat, lng, weight]` array for heatmap |
| `GET` | `/api/incidents/:id` | JWT | Get single incident details |
| `PATCH`| `/api/incidents/:id/status`| Admin | Moderate incident status (`reported`, `under_review`, `resolved`) |
| `DELETE`| `/api/incidents/:id` | Admin | Delete incident and its GridFS photo |
| `GET` | `/api/notifications` | JWT | Fetch personal notifications (auto-synced) |
| `GET` | `/api/notifications/count` | JWT | Get unread notification counter |
| `PATCH`| `/api/notifications/:id/read` | JWT | Mark a notification as read |
| `PATCH`| `/api/notifications/read-all` | JWT | Mark all user notifications as read |
| `GET` | `/api/digest/latest` | JWT | Get latest weekly neighborhood safety digest |
| `POST` | `/api/digest/generate` | JWT | Generate on-demand safety digest |
| `GET` | `/api/files/:fileId` | Public | Stream image binary directly from GridFS |

---

## 🧪 Automated Testing

SafeStreet includes an end-to-end integration test suite using **Jest**, **Supertest**, and **MongoMemoryServer** (zero network dependency during tests):

```bash
cd server
npm test
```

### Test Coverage Highlights:
- ✅ **Security**: Helmet security headers & unauthorized request interception.
- ✅ **Auth**: Registration, login, profile fetch, and GeoJSON coordinate updates.
- ✅ **Incidents**: Creation with multipart attachments & server-side anonymous reporter sanitization.
- ✅ **Geospatial Queries**: `$nearSphere` radius verification and heatmap point generation.
- ✅ **RBAC Protection**: Enforces 403 Forbidden for residents on admin routes and 200 OK for admins.
- ✅ **Weekly Digest**: On-demand digest calculation & retrieval.
- ✅ **Error Handling**: Standardized `{ success: false, message }` responses.

---

## 💡 Key Engineering Decisions

1. **Separation of `app.js` and `server.js`**:
   `app.js` exports Express without binding to a network port. This allows Supertest in Jest to run tests against the app in memory without creating port collisions.
2. **Context API over Redux**:
   Global authentication and Socket.IO connection state are lightweight and predictable. React Context API provides clean, low-overhead state without Redux boilerplate.
3. **Dual Notification Delivery**:
   Socket.IO delivers immediate live notifications to connected browser tabs, while MongoDB persistence guarantees that residents who were offline at the time of an incident still receive the alert on their next visit.
4. **Binary Magic Bytes over Extension Verification**:
   Validating file extensions or client MIME types alone is insecure. SafeStreet reads the first chunk of uploaded binary data directly from MongoDB GridFS to verify file signatures before confirming uploads.
5. **DNS SRV Resolution Resilience**:
   Node.js on Windows can encounter `querySrv ESERVFAIL` with MongoDB Atlas under some ISP DNS configurations. SafeStreet explicitly binds public fallback DNS resolvers (`8.8.8.8`, `1.1.1.1`) to ensure rock-solid connection reliability.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
