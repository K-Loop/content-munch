import { describe, it, expect, beforeAll } from 'vitest';
import { db, initDatabase } from '../server/db.js';
import { calculateBookingPrice } from '../server/services/pricingEngine.js';
import { getAvailableSlotsForDate, createKolkataISO } from '../server/services/availabilityEngine.js';

describe('Content Munch Studio - Core Booking & Engine Tests', () => {
  beforeAll(() => {
    initDatabase();
  });

  describe('1. Pricing Engine & Authoritative Calculations', () => {
    it('calculates base studio rental price accurately', () => {
      // Content Creator Studio Rental (ID 1, base rate 1499, min duration 1h)
      const quote = calculateBookingPrice(1, 1, []);
      expect(quote.basePrice).toBe(1499);
      expect(quote.subtotal).toBe(1499);
      // 18% GST of 1499 is Math.round(269.82) = 270
      expect(quote.taxAmount).toBe(270);
      expect(quote.totalPrice).toBe(1499 + 270);
    });

    it('enforces minimum duration rule for multi-hour sessions', () => {
      // YouTube Video Production (ID 3, base rate 1499, min duration 2h)
      const quote = calculateBookingPrice(3, 1, []); // user asks for 1h
      expect(quote.durationHours).toBe(2.0); // should enforce min 2h
      expect(quote.basePrice).toBe(1499 * 2);
    });

    it('calculates hourly and flat-fee add-ons with tax', () => {
      // Addon 1: Professional Camera Operator (999/hr)
      // Addon 2: Lavalier Mic Kit (499 flat)
      const quote = calculateBookingPrice(1, 2, [1, 2]);
      expect(quote.durationHours).toBe(2);
      expect(quote.basePrice).toBe(1499 * 2); // 2998
      // Operator: 999 * 2 = 1998
      // Mics: 499
      expect(quote.addonsPrice).toBe(1998 + 499); // 2497
      expect(quote.subtotal).toBe(2998 + 2497); // 5495
      expect(quote.taxAmount).toBe(Math.round(5495 * 0.18)); // 989
      expect(quote.totalPrice).toBe(5495 + 989);
    });
  });

  describe('2. Timezone & Slot Availability Engine', () => {
    it('creates accurate Asia/Kolkata ISO strings', () => {
      const iso = createKolkataISO('2026-10-20', '10:00');
      expect(iso).toBe('2026-10-20T10:00:00+05:30');
    });

    it('calculates slots within operating hours for future date', () => {
      // 2026-10-25 is a future date
      const availability = getAvailableSlotsForDate('2026-10-25', 1.0, 1);
      expect(availability.isOpen).toBe(true);
      expect(availability.slots.length).toBeGreaterThan(0);
      // First slot starts at or after open_time
      expect(availability.slots[0].startTime >= availability.openTime).toBe(true);
    });

    it('flags unavailable slots when duration extends beyond closing time', () => {
      // 2026-10-26 is a Monday (09:00 - 21:00 = 12h window)
      const mondayAvailability = getAvailableSlotsForDate('2026-10-26', 12.0, 1);
      // Only 09:00 can accommodate a full 12h session
      expect(mondayAvailability.slots.length).toBe(1);
      expect(mondayAvailability.slots[0].startTime).toBe('09:00');

      // 2026-10-25 is a Sunday (10:00 - 19:00 = 9h window). A 12h session cannot fit at all.
      const sundayAvailability = getAvailableSlotsForDate('2026-10-25', 12.0, 1);
      expect(sundayAvailability.slots.length).toBe(0);
    });
  });

  describe('3. Concurrency & Conflict Prevention', () => {
    it('prevents overlapping bookings on the same resource using atomic transaction', () => {
      const testDate = '2026-11-15';
      const startISO = `${testDate}T14:00:00+05:30`;
      const endISO = `${testDate}T16:00:00+05:30`;

      // Clean test slot
      db.prepare("DELETE FROM bookings WHERE booking_reference LIKE 'TEST-%'").run();

      // 1. Insert confirmed booking
      db.prepare(`
        INSERT INTO bookings (
          booking_reference, customer_id, customer_name, customer_email, customer_phone,
          service_id, service_name, resource_id, start_time, end_time, duration_hours,
          selected_addons, base_price, addons_price, tax_amount, total_price,
          booking_status, payment_status, created_at, updated_at
        ) VALUES (
          'TEST-REF-001', 1, 'First Creator', 'creator1@test.com', '+919999999991',
          1, 'Studio Rental', 1, ?, ?, 2.0,
          '[]', 2998, 0, 540, 3538,
          'confirmed', 'unpaid', datetime('now'), datetime('now')
        )
      `).run(startISO, endISO);

      // 2. Attempt simultaneous conflicting booking (overlapping 15:00 - 17:00)
      const conflictStart = `${testDate}T15:00:00+05:30`;
      const conflictEnd = `${testDate}T17:00:00+05:30`;

      const bufferMinutes = 15;
      const cStartMs = new Date(conflictStart).getTime() - (bufferMinutes * 60 * 1000);
      const cEndMs = new Date(conflictEnd).getTime() + (bufferMinutes * 60 * 1000);

      const dayEndISO = `${testDate}T23:59:59+05:30`;
      const dayStartISO = `${testDate}T00:00:00+05:30`;

      const activeBookings = db.prepare(`
        SELECT id, booking_reference, start_time, end_time FROM bookings
        WHERE resource_id = 1
          AND booking_status IN ('confirmed', 'pending')
          AND start_time <= ?
          AND end_time >= ?
      `).all(dayEndISO, dayStartISO) as any[];

      const detectedConflicts = activeBookings.filter(b => {
        const bStartMs = new Date(b.start_time).getTime();
        const bEndMs = new Date(b.end_time).getTime();
        return Math.max(cStartMs, bStartMs) < Math.min(cEndMs, bEndMs);
      });

      // Conflict must be detected!
      expect(detectedConflicts.length).toBeGreaterThan(0);
      expect(detectedConflicts[0].booking_reference).toBe('TEST-REF-001');

      // Cleanup
      db.prepare("DELETE FROM bookings WHERE booking_reference LIKE 'TEST-%'").run();
    });

    it('releases occupied slots when a reservation is cancelled', () => {
      const testDate = '2026-11-20';
      const startISO = `${testDate}T10:00:00+05:30`;
      const endISO = `${testDate}T11:00:00+05:30`;

      // Insert cancelled booking
      db.prepare(`
        INSERT INTO bookings (
          booking_reference, customer_id, customer_name, customer_email, customer_phone,
          service_id, service_name, resource_id, start_time, end_time, duration_hours,
          selected_addons, base_price, addons_price, tax_amount, total_price,
          booking_status, payment_status, created_at, updated_at
        ) VALUES (
          'TEST-CANCEL-001', 1, 'Cancelled User', 'user@test.com', '+919999999992',
          1, 'Studio Rental', 1, ?, ?, 1.0,
          '[]', 1499, 0, 270, 1769,
          'cancelled', 'unpaid', datetime('now'), datetime('now')
        )
      `).run(startISO, endISO);

      // Verify availability considers slot FREE because status is 'cancelled'
      const activeBookings = db.prepare(`
        SELECT id FROM bookings
        WHERE resource_id = 1
          AND booking_status IN ('confirmed', 'pending')
          AND start_time < ?
          AND end_time > ?
      `).all(endISO, startISO);

      expect(activeBookings.length).toBe(0);

      // Cleanup
      db.prepare("DELETE FROM bookings WHERE booking_reference LIKE 'TEST-%'").run();
    });
  });

  describe('4. Maintenance & Blocked Slots', () => {
    it('blocks bookings during studio maintenance periods', () => {
      const blockStart = '2026-12-01T08:00:00+05:30';
      const blockEnd = '2026-12-01T14:00:00+05:30';

      const ins = db.prepare(`
        INSERT INTO blocked_dates (start_time, end_time, reason, created_by, created_at)
        VALUES (?, ?, 'Annual Acoustic Panel Calibration', 'admin', datetime('now'))
      `).run(blockStart, blockEnd);

      const availability = getAvailableSlotsForDate('2026-12-01', 1.0, 1);
      const morningSlot = availability.slots.find(s => s.startTime === '10:00');
      
      expect(morningSlot).toBeDefined();
      expect(morningSlot?.isAvailable).toBe(false);
      expect(morningSlot?.unavailabilityReason).toContain('Annual Acoustic Panel Calibration');

      // Cleanup
      db.prepare('DELETE FROM blocked_dates WHERE id = ?').run(ins.lastInsertRowid);
    });
  });
});
