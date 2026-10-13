# Content Munch Studio by Social Angadi

> A premium, production-oriented single-page application (SPA) and booking management system for Content Munch Studio — Chennai’s hourly-rental creator studio in Pallikaranai, Tamil Nadu, India.

---

## 🌟 Overview & Highlights

- **Aesthetic Direction**: Sophisticated, editorial, warm and minimal design with Playfair Display typography, deep navy (`#0B132B`), warm off-white (`#FBF9F5`), and muted coral (`#D95D39`).
- **Real Studio Photography**: Includes authentic interior studio photography directly from Social Angadi's documentation with graceful loading skeletons and error fallbacks.
- **Working 8-Step Booking Engine**:
  1. Service Selection (Reels, YouTube, Podcasts, Talking Head, Product shoots, Tutorials, Corporate)
  2. Date & Duration (Asia/Kolkata timezone, past date protection, min/max booking limits)
  3. Start Time Slot selection (accounting for 15-minute buffers and opening hours)
  4. Optional Production Add-ons (Camera operator, wireless microphones, teleprompter)
  5. Creator Contact Details with validation
  6. Transparent Price Breakdown (Base rate + Addons + 18% GST)
  7. Terms acceptance & explicit confirmation
  8. Atomic Booking Persistence with unique reference code (`CM-YYYYMMDD-XXXX`)
- **Booking Conflict Prevention**: Server-side concurrency checks and atomic database transactions preventing overlapping reservations for the same studio resource.
- **Protected Admin Dashboard (`#admin`)**:
  - Operational KPIs: Today's sessions, occupied hours, revenue, live booking activity
  - Booking Management Table: Filter, search, paginate, status lifecycle, reschedule, assign staff, and CSV export
  - Interactive Studio Calendar: Month/Day views with Asia/Kolkata timestamps
  - Operating Hours & Maintenance Blocks: Configurable daily hours and maintenance closures
  - Authoritative Pricing & Services CRUD: Edit rates, minimum durations, and add-ons
  - Staff Management: Directory with collision-aware session assignments
  - Creator Directory: Customer profiles and session history
  - Audit Trail & Reporting: Comprehensive security logs and date-range utilization metrics

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Run in Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The embedded API middleware dynamically processes `/api/*` endpoints directly within the dev server.

### 3. Build for Production
```bash
npm run build
```
Production assets will be built to the `dist/` directory.

### 4. Run Production Standalone Server
```bash
npm run server
```
Launches the Express server serving both `/api` endpoints and the production SPA bundle on port `3001`.

---

## 🔐 Administrative Access

Navigate to [http://localhost:5173/#admin](http://localhost:5173/#admin) or click **Admin Portal** in the website footer.

- **Email**: `admin@contentmunch.com`
- **Password**: `ContentMunch@2026`
- **Role**: `owner`

---

## 📍 Verified Business Information

- **Studio Name**: Content Munch Studio by Social Angadi
- **Phone**: `+91 94896 80339`
- **Email**: `Socialangadi@gmail.com`
- **WhatsApp**: `+91 94896 80339`
- **Physical Address**: 45, Plot 3, FIRST FLOOR, Velachery Main Road, Madipakkam Main Road, Pallikaranai, Chennai - 600091
- **Timezone**: `Asia/Kolkata` (IST)
- **Operating Hours**: Mon–Sat 09:00 AM – 09:00 PM, Sun 10:00 AM – 07:00 PM

---

## 🗄️ Database Architecture

- **Default Local Storage**: SQLite with WAL (`Write-Ahead Logging`) mode, foreign keys, and atomic transactions via `better-sqlite3`.
- **Cloud PostgreSQL / Supabase Migration**: Full migration script included in `supabase/migrations/20261013000000_content_munch_init.sql` equipped with PostgreSQL range exclusion constraint (`btree_gist` on `tstzrange`) and Row Level Security (RLS) policies.
