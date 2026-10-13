import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { calculateBookingPrice } from '../services/pricingEngine.js';
import { getNowInKolkata } from '../services/availabilityEngine.js';
import { logAuditEvent } from '../services/auditLogger.js';

export const bookingsRouter = Router();

// Validation schema for creating a new booking
const createBookingSchema = z.object({
  serviceId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format'),
  durationHours: z.number().min(1).max(12),
  addonIds: z.array(z.number().int().positive()).optional().default([]),
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  customerEmail: z.string().trim().email('Invalid email address'),
  customerPhone: z.string().trim().min(8, 'Phone number must have at least 8 digits').max(20),
  customerNotes: z.string().max(1000).optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the studio booking terms and cancellation policy')
});

/**
 * Generate unique human-readable booking reference: CM-YYYYMMDD-XXXX
 */
function generateBookingReference(dateStr: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CM-${cleanDate}-${rand}`;
}

/**
 * POST /api/bookings - Atomic booking creation with concurrency conflict prevention
 */
bookingsRouter.post('/', (req: Request, res: Response) => {
  try {
    const parseResult = createBookingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.format()
      });
    }

    const {
      serviceId,
      date,
      startTime,
      durationHours,
      addonIds,
      customerName,
      customerEmail,
      customerPhone,
      customerNotes
    } = parseResult.data;

    const resourceId = 1; // Primary studio floor

    // Fetch studio settings
    const settingsRows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
    const settings = new Map(settingsRows.map(r => [r.key, r.value]));
    const bufferMinutes = parseInt(settings.get('setup_cleanup_buffer_minutes') || '15', 10);
    const minNoticeHours = parseFloat(settings.get('min_advance_notice_hours') || '2');

    // Calculate start & end ISO timestamps in Asia/Kolkata
    const [startH, startM] = startTime.split(':').map(Number);
    const totalStartMinutes = startH * 60 + startM;
    const totalEndMinutes = totalStartMinutes + Math.round(durationHours * 60);

    const endH = String(Math.floor(totalEndMinutes / 60)).padStart(2, '0');
    const endM = String(totalEndMinutes % 60).padStart(2, '0');
    const endTime = `${endH}:${endM}`;

    const startISO = `${date}T${startTime}:00+05:30`;
    const endISO = `${date}T${endTime}:00+05:30`;

    const startMs = new Date(startISO).getTime();
    const endMs = new Date(endISO).getTime();

    // Check past date / minimum notice
    const nowKolkata = getNowInKolkata();
    const minNoticeCutoff = nowKolkata.timestamp + (minNoticeHours * 60 * 60 * 1000);
    if (startMs < minNoticeCutoff) {
      return res.status(400).json({
        error: `Bookings require at least ${minNoticeHours} hours advance notice.`
      });
    }

    // Check operating hours for day of week
    const targetDate = new Date(`${date}T00:00:00+05:30`);
    const dayOfWeek = targetDate.getDay();
    const opHours = db.prepare('SELECT * FROM operating_hours WHERE day_of_week = ?').get(dayOfWeek) as {
      is_open: number;
      open_time: string;
      close_time: string;
    } | undefined;

    if (!opHours || !opHours.is_open) {
      return res.status(400).json({ error: 'The studio is closed on this day.' });
    }

    const [openH, openM] = opHours.open_time.split(':').map(Number);
    const [closeH, closeM] = opHours.close_time.split(':').map(Number);
    const openTotalM = openH * 60 + openM;
    const closeTotalM = closeH * 60 + closeM;

    if (totalStartMinutes < openTotalM || totalEndMinutes > closeTotalM) {
      return res.status(400).json({
        error: `Requested slot (${startTime} - ${endTime}) falls outside studio operating hours (${opHours.open_time} - ${opHours.close_time}).`
      });
    }

    // Verify service exists & is active
    const service = db.prepare('SELECT id, name, min_duration_hours FROM services WHERE id = ? AND is_active = 1').get(serviceId) as {
      id: number;
      name: string;
      min_duration_hours: number;
    } | undefined;

    if (!service) {
      return res.status(400).json({ error: 'Selected service is invalid or unavailable.' });
    }

    if (durationHours < service.min_duration_hours) {
      return res.status(400).json({
        error: `Minimum duration for ${service.name} is ${service.min_duration_hours} hour(s).`
      });
    }

    // Buffer range in milliseconds
    const startWithBufferMs = startMs - (bufferMinutes * 60 * 1000);
    const endWithBufferMs = endMs + (bufferMinutes * 60 * 1000);

    // =========================================================================
    // ATOMIC CONCURRENCY TRANSACTION (SQLite BEGIN IMMEDIATE)
    // =========================================================================
    const createBookingTransaction = db.transaction(() => {
      // 1. Re-check for overlapping bookings on the same resource
      // Find any confirmed or pending booking whose interval (buffered) intersects
      const dayEndISO = `${date}T23:59:59+05:30`;
      const dayStartISO = `${date}T00:00:00+05:30`;
      const overlappingBookings = db.prepare(`
        SELECT id, booking_reference, start_time, end_time, booking_status 
        FROM bookings
        WHERE resource_id = ?
          AND booking_status IN ('confirmed', 'pending')
          AND start_time <= ?
          AND end_time >= ?
      `).all(resourceId, dayEndISO, dayStartISO) as Array<{
        id: number;
        booking_reference: string;
        start_time: string;
        end_time: string;
      }>;

      for (const existing of overlappingBookings) {
        const existStartMs = new Date(existing.start_time).getTime();
        const existEndMs = new Date(existing.end_time).getTime();

        // Exact interval collision check with buffer
        if (Math.max(startWithBufferMs, existStartMs) < Math.min(endWithBufferMs, existEndMs)) {
          throw new Error('SLOT_ALREADY_RESERVED');
        }
      }

      // 2. Check blocked maintenance dates
      const overlappingBlocks = db.prepare(`
        SELECT reason, start_time, end_time 
        FROM blocked_dates
        WHERE start_time < ? AND end_time > ?
      `).all(endISO, startISO) as Array<{ reason: string; start_time: string; end_time: string }>;

      for (const blk of overlappingBlocks) {
        const blkStartMs = new Date(blk.start_time).getTime();
        const blkEndMs = new Date(blk.end_time).getTime();
        if (Math.max(startMs, blkStartMs) < Math.min(endMs, blkEndMs)) {
          throw new Error(`STUDIO_BLOCKED:${blk.reason}`);
        }
      }

      // 3. Compute authoritative pricing snapshot
      const pricing = calculateBookingPrice(serviceId, durationHours, addonIds);

      // 4. Create or update customer record
      let customer = db.prepare('SELECT id FROM customers WHERE LOWER(email) = LOWER(?)').get(customerEmail) as { id: number } | undefined;
      let customerId: number;
      const nowISO = new Date().toISOString();

      if (customer) {
        customerId = customer.id;
        db.prepare('UPDATE customers SET name = ?, phone = ? WHERE id = ?').run(customerName, customerPhone, customerId);
      } else {
        const custResult = db.prepare(`
          INSERT INTO customers (name, email, phone, notes, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(customerName, customerEmail, customerPhone, customerNotes || null, nowISO);
        customerId = Number(custResult.lastInsertRowid);
      }

      // 5. Generate unique booking reference
      let bookingRef = generateBookingReference(date);
      // Ensure reference uniqueness
      let attempts = 0;
      while (attempts < 5) {
        const exists = db.prepare('SELECT id FROM bookings WHERE booking_reference = ?').get(bookingRef);
        if (!exists) break;
        bookingRef = generateBookingReference(date);
        attempts++;
      }

      // 6. Insert new booking with confirmed status
      const insertResult = db.prepare(`
        INSERT INTO bookings (
          booking_reference, customer_id, customer_name, customer_email, customer_phone,
          service_id, service_name, resource_id, start_time, end_time, duration_hours,
          selected_addons, base_price, addons_price, tax_amount, total_price,
          booking_status, payment_status, customer_notes, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          'confirmed', 'unpaid', ?, ?, ?
        )
      `).run(
        bookingRef, customerId, customerName, customerEmail, customerPhone,
        service.id, service.name, resourceId, startISO, endISO, durationHours,
        JSON.stringify(pricing.addons), pricing.basePrice, pricing.addonsPrice, pricing.taxAmount, pricing.totalPrice,
        customerNotes || null, nowISO, nowISO
      );

      const bookingId = Number(insertResult.lastInsertRowid);

      // 7. Audit log
      logAuditEvent(customerName, 'BOOKING_CREATED', 'bookings', bookingId, {
        reference: bookingRef,
        service: service.name,
        date,
        time: `${startTime} - ${endTime}`,
        total: pricing.totalPrice
      });

      return {
        id: bookingId,
        bookingReference: bookingRef,
        serviceName: service.name,
        date,
        startTime,
        endTime,
        durationHours,
        startISO,
        endISO,
        pricing,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        status: 'confirmed',
        createdAt: nowISO
      };
    });

    const confirmedBooking = createBookingTransaction();
    return res.status(201).json({
      success: true,
      message: 'Your slot at Content Munch Studio has been successfully booked!',
      booking: confirmedBooking
    });

  } catch (err: any) {
    if (err.message === 'SLOT_ALREADY_RESERVED') {
      return res.status(409).json({
        error: 'Slot conflict',
        message: 'This slot was just claimed by another creator or conflicts with the studio schedule. Please select another slot.'
      });
    }
    if (err.message.startsWith('STUDIO_BLOCKED:')) {
      const reason = err.message.split('STUDIO_BLOCKED:')[1];
      return res.status(409).json({
        error: 'Studio blocked',
        message: `This slot is currently unavailable for bookings: ${reason}. Please choose an alternative slot.`
      });
    }

    console.error('Booking submission error:', err);
    return res.status(500).json({
      error: 'Booking failed',
      message: err.message || 'An error occurred while reserving your slot. Please try again.'
    });
  }
});

/**
 * GET /api/bookings/lookup/:ref - Public confirmation lookup
 */
bookingsRouter.get('/lookup/:ref', (req: Request, res: Response) => {
  const ref = req.params.ref.trim().toUpperCase();
  const booking = db.prepare(`
    SELECT 
      b.id, b.booking_reference, b.customer_name, b.service_name,
      b.start_time, b.end_time, b.duration_hours, b.selected_addons,
      b.base_price, b.addons_price, b.tax_amount, b.total_price,
      b.booking_status, b.payment_status, b.customer_notes, b.created_at,
      r.name as resource_name
    FROM bookings b
    JOIN resources r ON b.resource_id = r.id
    WHERE b.booking_reference = ?
  `).get(ref) as any;

  if (!booking) {
    return res.status(404).json({ error: 'Booking reference not found.' });
  }

  return res.json({
    booking: {
      ...booking,
      selected_addons: JSON.parse(booking.selected_addons || '[]')
    }
  });
});
