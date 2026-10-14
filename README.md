# Content Munch Studio by Social Angadi (100% Frontend-Only Application)

> A premium, client-only single-page application (SPA) and booking simulation system for Content Munch Studio — Chennai’s hourly-rental creator studio in Pallikaranai, Tamil Nadu, India.

---

## 🌟 Overview & Highlights

- **100% Frontend Architecture**: Runs entirely in the modern web browser with zero backend server dependencies, zero server runtimes, zero databases, and zero external authentication services.
- **Aesthetic Direction**: Sophisticated, editorial, warm and minimal design with Playfair Display typography, deep navy (`#0B132B`), warm off-white (`#FBF9F5`), and muted coral (`#D95D39`).
- **Real Studio Photography**: Includes authentic interior studio photography with responsive layouts and graceful fallbacks.
- **Working 8-Step Browser Booking Engine**:
  1. Service Selection (Reels, YouTube, Podcasts, Talking Head, Product shoots, Tutorials, Corporate)
  2. Date & Duration (Asia/Kolkata timezone, past date protection, min/max booking limits)
  3. Start Time Slot selection (accounting for 15-minute buffers and operating hours)
  4. Optional Production Add-ons (Camera operator, wireless microphones, teleprompter)
  5. Creator Contact Details with frontend validation
  6. Transparent Price Breakdown (Base rate + Addons + 18% GST)
  7. Terms acceptance & explicit confirmation
  8. Local Persistence with unique generated reference code (`CM-YYYYMMDD-XXXX`)
- **Frontend Conflict Prevention**: Pure client-side scheduling algorithms prevent double-booking the studio resource, account for cleanup buffers, and validate maintenance intervals.
- **Strict Initial Empty State**:
  - The application starts with clean, empty collections: zero bookings, zero customers, zero staff records, zero revenue, and zero blocked dates.
  - Informative empty states guide users when browsing the calendar, bookings list, and analytics.
- **Browser LocalStorage Persistence**:
  - Bookings created in the browser are persisted across page refreshes.
  - Safe error-handling, fallback memory mode, and a one-click **Reset Local Data** option in the Admin Portal.
- **Frontend Admin Dashboard (`#admin`)**:
  - Operational KPIs calculated live from local bookings
  - Booking Management: Filter, search, paginate, status lifecycle, reschedule, and staff assignments
  - Interactive Studio Calendar: Month and Day views with real booking indicators
  - Operating Hours & Maintenance Blocks: Configurable hours and blocked periods
  - Services & Add-on Pricing CRUD
  - Staff Management: Add, edit, remove, and assign local team members
  - Creator Directory: Customer profiles automatically derived from local booking history
  - Reports & Utilization: Real booking statistics and service breakdown

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
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Test Suite
```bash
npm test
```
Executes the Vitest test suite validating the pure frontend pricing engine, slot availability calculation, conflict prevention, cancellation slot release, and local storage persistence.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized static bundle in the `dist/` directory ready to be deployed to any static host (such as GitHub Pages, Vercel, Netlify, Cloudflare Pages, or AWS S3).

---

## 🔐 Administrative Access & Security Disclaimer

Navigate to [http://localhost:5173/#admin](http://localhost:5173/#admin) or click **Admin Portal** in the website footer.

> [!IMPORTANT]
> **Frontend Demo Security Notice**:
> This is a 100% frontend application. All admin routes and data storage are handled client-side in the browser via `localStorage`. Anyone with access to the same browser can view or reset this data. The admin login flow is provided strictly for demonstration and management convenience, without backend authentication or production security claims. No passwords or sensitive credentials are stored in `localStorage`.

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

## 🏗️ Project Architecture

```
content-munch/
├── src/
│   ├── admin/               # Admin portal & management tabs
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminLogin.jsx
│   │   └── tabs/            # Overview, Bookings, Calendar, Hours, Pricing, Staff, Customers, Reports
│   ├── components/          # Reusable UI components & marketing sections
│   │   ├── BookingEngine.jsx
│   │   ├── BookingLookupModal.jsx
│   │   ├── ContactSection.jsx
│   │   ├── Facilities.jsx
│   │   ├── FaqSection.jsx
│   │   ├── Footer.jsx
│   │   ├── Gallery.jsx
│   │   ├── Hero.jsx
│   │   ├── Navbar.jsx
│   │   ├── Pricing.jsx
│   │   ├── Services.jsx
│   │   └── StudioIntro.jsx
│   ├── services/            # Pure frontend business logic & persistence
│   │   ├── availabilityEngine.js  # Slot generation, timezone calculations, collision checks
│   │   ├── bookingService.js      # Booking CRUD, metrics, derived customers, reports
│   │   ├── defaultData.js         # Initial configurations (services, addons, settings, hours)
│   │   ├── pricingEngine.js       # Dynamic quote calculations, tax, add-ons
│   │   └── storageService.js      # Safe localStorage persistence with error handling & reset
│   ├── lib/
│   │   ├── api.js           # Frontend API adapter wrapping local services
│   │   └── useAnimations.js # IntersectionObserver & scroll reveal hooks
│   ├── App.jsx              # Main routing & state coordinator
│   └── index.css            # Tailored styling & design tokens
├── tests/
│   └── booking.test.ts      # Automated unit & integration tests for client engines
└── dist/                    # Static production output
```
