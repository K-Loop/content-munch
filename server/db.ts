import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'content_munch.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency & busy timeout
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL
    );

    -- Resources (Studio Rooms)
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      capacity INTEGER DEFAULT 10,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Operating Hours
    CREATE TABLE IF NOT EXISTS operating_hours (
      day_of_week INTEGER PRIMARY KEY, -- 0=Sunday, 1=Monday ... 6=Saturday
      day_name TEXT NOT NULL,
      open_time TEXT NOT NULL, -- "HH:MM" e.g. "09:00"
      close_time TEXT NOT NULL, -- "HH:MM" e.g. "21:00"
      is_open INTEGER DEFAULT 1
    );

    -- Blocked / Maintenance Dates
    CREATE TABLE IF NOT EXISTS blocked_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT NOT NULL, -- ISO string
      end_time TEXT NOT NULL,   -- ISO string
      reason TEXT NOT NULL,
      created_by TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    -- Services
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      base_hourly_rate REAL NOT NULL,
      min_duration_hours REAL DEFAULT 1.0,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );

    -- Add-ons (e.g. Camera Operator, Extra Lighting Rig, Audio Engineer)
    CREATE TABLE IF NOT EXISTS addons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price_type TEXT NOT NULL, -- 'flat' | 'per_hour'
      price REAL NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    -- Staff Members
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      role TEXT NOT NULL, -- 'manager' | 'operator' | 'support'
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- Bookings
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_reference TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      service_id INTEGER NOT NULL,
      service_name TEXT NOT NULL,
      resource_id INTEGER DEFAULT 1,
      start_time TEXT NOT NULL, -- ISO timestamp (Asia/Kolkata ISO)
      end_time TEXT NOT NULL,   -- ISO timestamp (Asia/Kolkata ISO)
      duration_hours REAL NOT NULL,
      selected_addons TEXT NOT NULL DEFAULT '[]', -- JSON string
      base_price REAL NOT NULL,
      addons_price REAL NOT NULL,
      tax_amount REAL NOT NULL,
      total_price REAL NOT NULL,
      booking_status TEXT NOT NULL DEFAULT 'confirmed', -- 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show'
      payment_status TEXT NOT NULL DEFAULT 'unpaid',     -- 'unpaid' | 'deposit_paid' | 'paid' | 'refunded'
      assigned_staff_id INTEGER,
      assigned_staff_name TEXT,
      customer_notes TEXT,
      internal_notes TEXT,
      cancellation_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (resource_id) REFERENCES resources(id),
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
    );

    -- Indexes for high-performance scheduling queries
    CREATE INDEX IF NOT EXISTS idx_bookings_time_status 
      ON bookings(resource_id, start_time, end_time, booking_status);
    CREATE INDEX IF NOT EXISTS idx_bookings_ref 
      ON bookings(booking_reference);
    CREATE INDEX IF NOT EXISTS idx_bookings_customer 
      ON bookings(customer_email, customer_phone);

    -- Admin Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin', -- 'owner' | 'admin' | 'booking_manager'
      created_at TEXT NOT NULL
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT, -- JSON
      created_at TEXT NOT NULL
    );
  `);

  seedDefaultData();
}

function seedDefaultData() {
  const now = new Date().toISOString();

  // 1. Resources
  const resourceCount = db.prepare('SELECT COUNT(*) as count FROM resources').get() as { count: number };
  if (resourceCount.count === 0) {
    db.prepare(`
      INSERT INTO resources (id, name, description, capacity, is_active, created_at)
      VALUES (1, 'Main Creation Studio (Studio A)', 'Fully sound-dampened 400 sq.ft studio with modular backdrops, Godox lighting grid, and acoustic paneling', 12, 1, ?)
    `).run(now);
  }

  // 2. Settings (Pricing, Timezone, Buffer, Notice)
  const defaultSettings = [
    { key: 'studio_timezone', value: 'Asia/Kolkata', description: 'Authoritative timezone for studio operations' },
    { key: 'base_hourly_rate', value: '1499', description: 'Authoritative base hourly rental rate in INR (₹)' },
    { key: 'min_booking_duration_hours', value: '1', description: 'Minimum booking duration in hours' },
    { key: 'booking_increment_hours', value: '1', description: 'Duration increment allowed (1h, 2h, etc.)' },
    { key: 'setup_cleanup_buffer_minutes', value: '15', description: 'Buffer time between bookings for sanitization and reset' },
    { key: 'min_advance_notice_hours', value: '2', description: 'Minimum advance notice required to book' },
    { key: 'max_advance_booking_days', value: '60', description: 'How far in advance clients can reserve' },
    { key: 'applicable_tax_percentage', value: '18', description: 'GST percentage (18%)' },
    { key: 'deposit_requirement_percentage', value: '0', description: 'Advance deposit percentage (0 = pay at studio, or customizable)' },
    { key: 'cancellation_policy', value: 'Free cancellation up to 24 hours prior to scheduled slot. 50% cancellation fee within 24 hours.', description: 'Cancellation & rescheduling terms' },
    { key: 'contact_phone', value: '+919489680339', description: 'Confirmed studio contact phone' },
    { key: 'contact_email', value: 'Socialangadi@gmail.com', description: 'Confirmed studio email' },
    { key: 'contact_address', value: '45, Plot 3, FIRST FLOOR, Velachery Main Road, Madipakkam Main Road, Pallikaranai, Chennai-600091', description: 'Physical studio address' },
    { key: 'whatsapp_number', value: '919489680339', description: 'WhatsApp business contact' }
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, description, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.value, s.description, now);
  }

  // 3. Operating Hours (Monday-Saturday: 09:00 - 21:00, Sunday: 10:00 - 19:00)
  const opHoursCount = db.prepare('SELECT COUNT(*) as count FROM operating_hours').get() as { count: number };
  if (opHoursCount.count === 0) {
    const days = [
      { day: 0, name: 'Sunday', open: '10:00', close: '19:00', isOpen: 1 },
      { day: 1, name: 'Monday', open: '09:00', close: '21:00', isOpen: 1 },
      { day: 2, name: 'Tuesday', open: '09:00', close: '21:00', isOpen: 1 },
      { day: 3, name: 'Wednesday', open: '09:00', close: '21:00', isOpen: 1 },
      { day: 4, name: 'Thursday', open: '09:00', close: '21:00', isOpen: 1 },
      { day: 5, name: 'Friday', open: '09:00', close: '21:00', isOpen: 1 },
      { day: 6, name: 'Saturday', open: '09:00', close: '21:00', isOpen: 1 },
    ];
    const insertOpHour = db.prepare(`
      INSERT INTO operating_hours (day_of_week, day_name, open_time, close_time, is_open)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const d of days) {
      insertOpHour.run(d.day, d.name, d.open, d.close, d.isOpen);
    }
  }

  // 4. Services (matching studio's real offerings)
  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
  if (serviceCount.count === 0) {
    const defaultServices = [
      {
        name: 'Content Creator Studio Rental',
        slug: 'content-creator-rental',
        description: 'Complete studio rental with professional lighting rig, multi-color seamless backdrops, acoustic damping, and air conditioning.',
        base_hourly_rate: 1499,
        min_duration_hours: 1.0,
        sort_order: 1
      },
      {
        name: 'Instagram Reels & Short-Form Video',
        slug: 'instagram-reels-shoots',
        description: 'Optimized vertical shooting set with ring lights, RGB mood lighting, aesthetic furniture, and rapid setup changes.',
        base_hourly_rate: 1499,
        min_duration_hours: 1.0,
        sort_order: 2
      },
      {
        name: 'YouTube Video Production Session',
        slug: 'youtube-video-production',
        description: 'Spacious studio bay with key, fill, and rim lights, teleprompter mount space, and comfortable creator staging.',
        base_hourly_rate: 1499,
        min_duration_hours: 2.0,
        sort_order: 3
      },
      {
        name: 'Podcast Recording Session',
        slug: 'podcast-recording',
        description: 'Sound-controlled environment with podcast table, high-grade acoustic treatment, and warm conversational aesthetic.',
        base_hourly_rate: 1799,
        min_duration_hours: 1.0,
        sort_order: 4
      },
      {
        name: 'Interviews & Talking-Head Videos',
        slug: 'interviews-talking-head',
        description: 'Clean executive backdrop setup with soft portrait illumination and wireless mic compatibility.',
        base_hourly_rate: 1699,
        min_duration_hours: 1.0,
        sort_order: 5
      },
      {
        name: 'Product Photography & Demo Videos',
        slug: 'product-photography-videos',
        description: 'Overhead shooting rig setup, product podiums, turntable support, and crisp macro lighting.',
        base_hourly_rate: 1499,
        min_duration_hours: 1.0,
        sort_order: 6
      },
      {
        name: 'Tutorials & Educational Content',
        slug: 'tutorials-educational',
        description: 'Presentation friendly space with blackboard/whiteboard backdrop options and high-clarity key lights.',
        base_hourly_rate: 1499,
        min_duration_hours: 2.0,
        sort_order: 7
      },
      {
        name: 'Corporate Brand Content',
        slug: 'corporate-video-content',
        description: 'Professional setup tailored for corporate announcements, leadership messages, and company case studies.',
        base_hourly_rate: 1999,
        min_duration_hours: 2.0,
        sort_order: 8
      }
    ];

    const insertService = db.prepare(`
      INSERT INTO services (name, slug, description, base_hourly_rate, min_duration_hours, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);
    for (const s of defaultServices) {
      insertService.run(s.name, s.slug, s.description, s.base_hourly_rate, s.min_duration_hours, s.sort_order);
    }
  }

  // 5. Add-ons (clearly distinguished optional production assistance)
  const addonCount = db.prepare('SELECT COUNT(*) as count FROM addons').get() as { count: number };
  if (addonCount.count === 0) {
    const defaultAddons = [
      {
        name: 'Professional Camera Support & Operator',
        description: 'Dedicated studio camera operator with 4K camera rig & framing support throughout your session.',
        price_type: 'per_hour',
        price: 999
      },
      {
        name: 'Wireless Studio Lavalier Mic Kit (2x)',
        description: 'Broadcast-grade wireless dual lavalier microphone kit with receiver for crisp dialogue capture.',
        price_type: 'flat',
        price: 499
      },
      {
        name: 'Teleprompter Setup & iPad Operator',
        description: 'Professional prompter rig with scrolling software to read scripts seamlessly during video shoots.',
        price_type: 'flat',
        price: 699
      },
      {
        name: 'RGB Dynamic Tube Lighting Rig',
        description: 'Pair of Nanlite/Godox Pavotube RGB color-effect lights for cinematic styling.',
        price_type: 'flat',
        price: 399
      }
    ];

    const insertAddon = db.prepare(`
      INSERT INTO addons (name, description, price_type, price, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    for (const a of defaultAddons) {
      insertAddon.run(a.name, a.description, a.price_type, a.price);
    }
  }

  // 6. Staff
  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get() as { count: number };
  if (staffCount.count === 0) {
    const defaultStaff = [
      { name: 'Karthik Raja', email: 'karthik@socialangadi.com', phone: '+919489680339', role: 'manager' },
      { name: 'Sathish Kumar', email: 'sathish@socialangadi.com', phone: '+919840123456', role: 'operator' },
      { name: 'Praveen V', email: 'praveen@socialangadi.com', phone: '+919789123456', role: 'support' },
    ];
    const insertStaff = db.prepare(`
      INSERT INTO staff (name, email, phone, role, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    for (const st of defaultStaff) {
      insertStaff.run(st.name, st.email, st.phone, st.role, now);
    }
  }

  // 7. Admin Users (Owner & Studio Manager)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    // Default initial admin setup for Content Munch Studio
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('ContentMunch@2026', salt);
    
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES ('Studio Director', 'admin@contentmunch.com', ?, 'owner', ?)
    `).run(hash, now);
  }
}
