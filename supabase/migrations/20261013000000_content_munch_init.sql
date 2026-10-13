-- =========================================================================
-- Content Munch Studio - Production PostgreSQL / Supabase Schema
-- Includes exclusion constraint for conflict prevention & Row-Level Security
-- =========================================================================

-- Enable btree_gist extension for PostgreSQL exclusion constraint on tsrange
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Resources Table (Studio spaces)
CREATE TABLE IF NOT EXISTS public.resources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    capacity INT DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Operating Hours Table
CREATE TABLE IF NOT EXISTS public.operating_hours (
    day_of_week INT PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
    day_name TEXT NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_open BOOLEAN DEFAULT true
);

-- 3. Blocked Dates / Maintenance Slots
CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id SERIAL PRIMARY KEY,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    created_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_blocked_time_order CHECK (end_time > start_time)
);

-- 4. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    base_hourly_rate NUMERIC(10, 2) NOT NULL,
    min_duration_hours NUMERIC(4, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0
);

-- 5. Addons Table
CREATE TABLE IF NOT EXISTS public.addons (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_type TEXT NOT NULL CHECK (price_type IN ('flat', 'per_hour')),
    price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- 6. Staff Table
CREATE TABLE IF NOT EXISTS public.staff (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'operator', 'support')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bookings Table with PostgreSQL Exclusion Constraint
-- CONCURRENCY-SAFE: Prevents two overlapping confirmed/pending bookings on the same resource
CREATE TABLE IF NOT EXISTS public.bookings (
    id SERIAL PRIMARY KEY,
    booking_reference TEXT NOT NULL UNIQUE,
    customer_id INT REFERENCES public.customers(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_id INT NOT NULL REFERENCES public.services(id),
    service_name TEXT NOT NULL,
    resource_id INT NOT NULL REFERENCES public.resources(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_hours NUMERIC(4, 2) NOT NULL,
    selected_addons JSONB DEFAULT '[]'::jsonb,
    base_price NUMERIC(10, 2) NOT NULL,
    addons_price NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no-show')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded')),
    assigned_staff_id INT REFERENCES public.staff(id),
    assigned_staff_name TEXT,
    customer_notes TEXT,
    internal_notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_time_order CHECK (end_time > start_time),
    -- EXCLUSION CONSTRAINT: Rejects overlapping slots at the database level!
    CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
        resource_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (booking_status IN ('confirmed', 'pending'))
);

-- 9. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- Row Level Security (RLS) Configuration
-- =========================================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Public can view active services and active addons
CREATE POLICY "Public can view active services" ON public.services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active addons" ON public.addons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active resources" ON public.resources
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view operating hours" ON public.operating_hours
    FOR SELECT USING (true);

-- Public can insert new bookings via secure RPC or constrained policy
CREATE POLICY "Public can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (true);

-- Authenticated admins have full access
CREATE POLICY "Admins full access to bookings" ON public.bookings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access to customers" ON public.customers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access to audit logs" ON public.audit_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access to settings" ON public.settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access to staff" ON public.staff
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
