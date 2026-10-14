import { describe, it, expect, beforeEach } from 'vitest';
import { calculateBookingPrice } from '../src/services/pricingEngine.js';
import { getAvailableSlotsForDate, createKolkataISO } from '../src/services/availabilityEngine.js';
import { 
  createFrontendBooking, 
  updateFrontendBookingStatus, 
  rescheduleFrontendBooking,
  lookupFrontendBooking,
  getDashboardMetrics,
  getDerivedCustomers
} from '../src/services/bookingService.js';
import { 
  resetAllLocalData, 
  getStoredBookings, 
  getStoredStaff, 
  getStoredBlockedDates,
  saveStoredBlockedDates
} from '../src/services/storageService.js';

describe('Content Munch Studio - 100% Frontend Booking & Scheduling Engine Tests', () => {
  beforeEach(() => {
    resetAllLocalData();
  });

  describe('1. Initial State Requirements', () => {
    it('starts with completely clean and empty collections', () => {
      expect(getStoredBookings()).toEqual([]);
      expect(getStoredStaff()).toEqual([]);
      expect(getStoredBlockedDates()).toEqual([]);
      expect(getDerivedCustomers()).toEqual([]);

      const metrics = getDashboardMetrics();
      expect(metrics.counts.confirmed).toBe(0);
      expect(metrics.recordedRevenue).toBe(0);
      expect(metrics.totalOccupiedHours).toBe(0);
      expect(metrics.recentBookings).toEqual([]);
    });
  });

  describe('2. Pricing Engine & Authoritative Calculations', () => {
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

  describe('3. Timezone & Slot Availability Engine', () => {
    it('creates accurate Asia/Kolkata ISO strings', () => {
      const iso = createKolkataISO('2026-10-20', '10:00');
      expect(iso).toBe('2026-10-20T10:00:00+05:30');
    });

    it('calculates slots within operating hours for future date', () => {
      // 2026-10-25 is a future date
      const availability = getAvailableSlotsForDate('2026-10-25', 1.0, 1);
      expect(availability.isOpen).toBe(true);
      expect(availability.slots.length).toBeGreaterThan(0);
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

  describe('4. In-Browser Booking Creation, Conflict Prevention & Lifecycle', () => {
    it('creates a local booking and generates a unique reference', () => {
      const result = createFrontendBooking({
        serviceId: 1,
        date: '2026-11-15',
        startTime: '10:00',
        durationHours: 2,
        customerName: 'Ananya Sharma',
        customerEmail: 'ananya@creator.com',
        customerPhone: '+91 9840123456'
      });

      expect(result.booking).toBeDefined();
      expect(result.booking.bookingReference).toMatch(/^CM-20261115-[A-Z0-9]{4}$/);
      expect(result.booking.duration_hours).toBe(2);

      // Verify persistence in storage
      const stored = getStoredBookings();
      expect(stored.length).toBe(1);
      expect(stored[0].booking_reference).toBe(result.booking.bookingReference);

      // Verify derived customer
      const customers = getDerivedCustomers();
      expect(customers.length).toBe(1);
      expect(customers[0].name).toBe('Ananya Sharma');
      expect(customers[0].total_bookings).toBe(1);
    });

    it('rejects overlapping bookings on the same resource in the frontend', () => {
      const testDate = '2026-11-15';
      
      // 1. First booking: 14:00 - 16:00
      createFrontendBooking({
        serviceId: 1,
        date: testDate,
        startTime: '14:00',
        durationHours: 2,
        customerName: 'First Creator',
        customerEmail: 'first@test.com',
        customerPhone: '+919999999991'
      });

      // 2. Conflicting booking: 15:00 - 17:00 (overlaps with 14:00 - 16:00 + 15m buffer)
      expect(() => {
        createFrontendBooking({
          serviceId: 1,
          date: testDate,
          startTime: '15:00',
          durationHours: 2,
          customerName: 'Conflicting Creator',
          customerEmail: 'second@test.com',
          customerPhone: '+919999999992'
        });
      }).toThrow(/already booked/i);
    });

    it('releases occupied slots when a reservation is cancelled', () => {
      const testDate = '2026-11-20';

      const res = createFrontendBooking({
        serviceId: 1,
        date: testDate,
        startTime: '10:00',
        durationHours: 1,
        customerName: 'Test Creator',
        customerEmail: 'test@creator.com',
        customerPhone: '+919999999993'
      });

      // Verify slot is unavailable
      let availability = getAvailableSlotsForDate(testDate, 1.0, 1);
      let slot10 = availability.slots.find(s => s.startTime === '10:00');
      expect(slot10?.isAvailable).toBe(false);

      // Cancel reservation
      updateFrontendBookingStatus(res.booking.id, 'cancelled', 'User cancelled test');

      // Verify slot is now available again
      availability = getAvailableSlotsForDate(testDate, 1.0, 1);
      slot10 = availability.slots.find(s => s.startTime === '10:00');
      expect(slot10?.isAvailable).toBe(true);
    });

    it('validates conflicts when rescheduling a booking', () => {
      const testDate = '2026-11-22';

      // Booking A: 10:00 - 11:00
      const bA = createFrontendBooking({
        serviceId: 1,
        date: testDate,
        startTime: '10:00',
        durationHours: 1,
        customerName: 'Booking A',
        customerEmail: 'a@test.com',
        customerPhone: '+919999999994'
      });

      // Booking B: 14:00 - 15:00
      const bB = createFrontendBooking({
        serviceId: 1,
        date: testDate,
        startTime: '14:00',
        durationHours: 1,
        customerName: 'Booking B',
        customerEmail: 'b@test.com',
        customerPhone: '+919999999995'
      });

      // Reschedule Booking B to 10:00 -> should conflict with Booking A!
      expect(() => {
        rescheduleFrontendBooking(bB.booking.id, testDate, '10:00');
      }).toThrow(/overlaps with an existing booking/i);

      // Reschedule Booking B to 16:00 -> should succeed!
      const updated = rescheduleFrontendBooking(bB.booking.id, testDate, '16:00');
      expect(updated.booking.start_time).toContain('16:00');
    });

    it('allows looking up booking by reference code', () => {
      const created = createFrontendBooking({
        serviceId: 2,
        date: '2026-11-25',
        startTime: '11:00',
        durationHours: 1,
        customerName: 'Rohan Verma',
        customerEmail: 'rohan@reels.com',
        customerPhone: '+919840999888'
      });

      const found = lookupFrontendBooking(created.booking.bookingReference);
      expect(found.booking.customer_name).toBe('Rohan Verma');
      expect(found.booking.service_name).toBe('Instagram Reels & Short-Form Video');
    });
  });

  describe('5. Maintenance & Blocked Slots', () => {
    it('blocks bookings during studio maintenance periods in the browser', () => {
      const blockStart = '2026-12-01T08:00:00+05:30';
      const blockEnd = '2026-12-01T14:00:00+05:30';

      saveStoredBlockedDates([
        {
          id: 101,
          start_time: blockStart,
          end_time: blockEnd,
          reason: 'Annual Acoustic Panel Calibration',
          created_by: 'admin',
          created_at: new Date().toISOString()
        }
      ]);

      const availability = getAvailableSlotsForDate('2026-12-01', 1.0, 1);
      const morningSlot = availability.slots.find(s => s.startTime === '10:00');

      expect(morningSlot).toBeDefined();
      expect(morningSlot?.isAvailable).toBe(false);
      expect(morningSlot?.unavailabilityReason).toContain('Annual Acoustic Panel Calibration');

      // Attempting to book during maintenance throws error
      expect(() => {
        createFrontendBooking({
          serviceId: 1,
          date: '2026-12-01',
          startTime: '10:00',
          durationHours: 1,
          customerName: 'Blocked User',
          customerEmail: 'user@test.com',
          customerPhone: '+919999999999'
        });
      }).toThrow(/closed for maintenance/i);
    });
  });
});
