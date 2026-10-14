// Default configuration and studio definitions for Content Munch Studio

export const DEFAULT_RESOURCES = [
  {
    id: 1,
    name: 'Main Creation Studio (Studio A)',
    description: 'Fully sound-dampened 400 sq.ft studio with modular backdrops, Godox lighting grid, and acoustic paneling',
    capacity: 12,
    is_active: 1
  }
];

export const DEFAULT_SETTINGS = [
  { key: 'studio_timezone', value: 'Asia/Kolkata', description: 'Authoritative timezone for studio operations' },
  { key: 'base_hourly_rate', value: '1499', description: 'Authoritative base hourly rental rate in INR (₹)' },
  { key: 'min_booking_duration_hours', value: '1', description: 'Minimum booking duration in hours' },
  { key: 'booking_increment_hours', value: '1', description: 'Duration increment allowed (1h, 2h, etc.)' },
  { key: 'setup_cleanup_buffer_minutes', value: '15', description: 'Buffer time between bookings for sanitization and reset' },
  { key: 'min_advance_notice_hours', value: '2', description: 'Minimum advance notice required to book' },
  { key: 'max_advance_booking_days', value: '60', description: 'How far in advance clients can reserve' },
  { key: 'applicable_tax_percentage', value: '18', description: 'GST percentage (18%)' },
  { key: 'deposit_requirement_percentage', value: '0', description: 'Advance deposit percentage (0 = pay at studio)' },
  { key: 'cancellation_policy', value: 'Free cancellation up to 24 hours prior to scheduled slot. 50% cancellation fee within 24 hours.', description: 'Cancellation & rescheduling terms' },
  { key: 'contact_phone', value: '+919489680339', description: 'Confirmed studio contact phone' },
  { key: 'contact_email', value: 'Socialangadi@gmail.com', description: 'Confirmed studio email' },
  { key: 'contact_address', value: '45, Plot 3, FIRST FLOOR, Velachery Main Road, Madipakkam Main Road, Pallikaranai, Chennai-600091', description: 'Physical studio address' },
  { key: 'whatsapp_number', value: '919489680339', description: 'WhatsApp business contact' }
];

export const DEFAULT_OPERATING_HOURS = [
  { day_of_week: 0, day_name: 'Sunday', open_time: '10:00', close_time: '19:00', is_open: 1 },
  { day_of_week: 1, day_name: 'Monday', open_time: '09:00', close_time: '21:00', is_open: 1 },
  { day_of_week: 2, day_name: 'Tuesday', open_time: '09:00', close_time: '21:00', is_open: 1 },
  { day_of_week: 3, day_name: 'Wednesday', open_time: '09:00', close_time: '21:00', is_open: 1 },
  { day_of_week: 4, day_name: 'Thursday', open_time: '09:00', close_time: '21:00', is_open: 1 },
  { day_of_week: 5, day_name: 'Friday', open_time: '09:00', close_time: '21:00', is_open: 1 },
  { day_of_week: 6, day_name: 'Saturday', open_time: '09:00', close_time: '21:00', is_open: 1 },
];

export const DEFAULT_SERVICES = [
  {
    id: 1,
    name: 'Content Creator Studio Rental',
    slug: 'content-creator-rental',
    description: 'Complete studio rental with professional lighting rig, multi-color seamless backdrops, acoustic damping, and air conditioning.',
    base_hourly_rate: 1499,
    min_duration_hours: 1.0,
    sort_order: 1,
    is_active: 1
  },
  {
    id: 2,
    name: 'Instagram Reels & Short-Form Video',
    slug: 'instagram-reels-shoots',
    description: 'Optimized vertical shooting set with ring lights, RGB mood lighting, aesthetic furniture, and rapid setup changes.',
    base_hourly_rate: 1499,
    min_duration_hours: 1.0,
    sort_order: 2,
    is_active: 1
  },
  {
    id: 3,
    name: 'YouTube Video Production Session',
    slug: 'youtube-video-production',
    description: 'Spacious studio bay with key, fill, and rim lights, teleprompter mount space, and comfortable creator staging.',
    base_hourly_rate: 1499,
    min_duration_hours: 2.0,
    sort_order: 3,
    is_active: 1
  },
  {
    id: 4,
    name: 'Podcast Recording Session',
    slug: 'podcast-recording',
    description: 'Sound-controlled environment with podcast table, high-grade acoustic treatment, and warm conversational aesthetic.',
    base_hourly_rate: 1799,
    min_duration_hours: 1.0,
    sort_order: 4,
    is_active: 1
  },
  {
    id: 5,
    name: 'Interviews & Talking-Head Videos',
    slug: 'interviews-talking-head',
    description: 'Clean executive backdrop setup with soft portrait illumination and wireless mic compatibility.',
    base_hourly_rate: 1699,
    min_duration_hours: 1.0,
    sort_order: 5,
    is_active: 1
  },
  {
    id: 6,
    name: 'Product Photography & Demo Videos',
    slug: 'product-photography-videos',
    description: 'Overhead shooting rig setup, product podiums, turntable support, and crisp macro lighting.',
    base_hourly_rate: 1499,
    min_duration_hours: 1.0,
    sort_order: 6,
    is_active: 1
  },
  {
    id: 7,
    name: 'Tutorials & Educational Content',
    slug: 'tutorials-educational',
    description: 'Presentation friendly space with blackboard/whiteboard backdrop options and high-clarity key lights.',
    base_hourly_rate: 1499,
    min_duration_hours: 2.0,
    sort_order: 7,
    is_active: 1
  },
  {
    id: 8,
    name: 'Corporate Brand Content',
    slug: 'corporate-video-content',
    description: 'Professional setup tailored for corporate announcements, leadership messages, and company case studies.',
    base_hourly_rate: 1999,
    min_duration_hours: 2.0,
    sort_order: 8,
    is_active: 1
  }
];

export const DEFAULT_ADDONS = [
  {
    id: 1,
    name: 'Professional Camera Support & Operator',
    description: 'Dedicated studio camera operator with 4K camera rig & framing support throughout your session.',
    price_type: 'per_hour',
    price: 999,
    is_active: 1
  },
  {
    id: 2,
    name: 'Wireless Studio Lavalier Mic Kit (2x)',
    description: 'Broadcast-grade wireless dual lavalier microphone kit with receiver for crisp dialogue capture.',
    price_type: 'flat',
    price: 499,
    is_active: 1
  },
  {
    id: 3,
    name: 'Teleprompter Setup & iPad Operator',
    description: 'Professional prompter rig with scrolling software to read scripts seamlessly during video shoots.',
    price_type: 'flat',
    price: 699,
    is_active: 1
  },
  {
    id: 4,
    name: 'RGB Dynamic Tube Lighting Rig',
    description: 'Pair of Nanlite/Godox Pavotube RGB color-effect lights for cinematic styling.',
    price_type: 'flat',
    price: 399,
    is_active: 1
  }
];
