import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateAdmin, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAuditEvent } from '../services/auditLogger.js';
import { calculateBookingPrice } from '../services/pricingEngine.js';
import { getNowInKolkata } from '../services/availabilityEngine.js';

export const adminRouter = Router();

// Protect all admin routes
adminRouter.use(authenticateAdmin);

// =========================================================================
// B. DASHBOARD OVERVIEW METRICS
// =========================================================================
adminRouter.get('/metrics', (req: AuthenticatedRequest, res: Response) => {
  try {
    const todayKolkata = getNowInKolkata().dateStr;
    const todayStart = `${todayKolkata}T00:00:00+05:30`;
    const todayEnd = `${todayKolkata}T23:59:59+05:30`;

    // Today's Bookings
    const todayStats = db.prepare(`
      SELECT 
        COUNT(*) as total_today,
        SUM(duration_hours) as occupied_hours_today,
        SUM(total_price) as total_today_value
      FROM bookings
      WHERE start_time >= ? AND start_time <= ? AND booking_status != 'cancelled'
    `).get(todayStart, todayEnd) as any;

    // Status breakdown across all bookings
    const statusCounts = db.prepare(`
      SELECT booking_status, COUNT(*) as count, SUM(total_price) as sum_price, SUM(duration_hours) as sum_hours
      FROM bookings
      GROUP BY booking_status
    `).all() as any[];

    const statusMap: Record<string, { count: number; value: number; hours: number }> = {};
    for (const row of statusCounts) {
      statusMap[row.booking_status] = {
        count: row.count,
        value: row.sum_price || 0,
        hours: row.sum_hours || 0
      };
    }

    // Upcoming sessions (from now forward)
    const upcomingCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE start_time >= ? AND booking_status IN ('confirmed', 'pending')
    `).get(new Date().toISOString()) as { count: number };

    // Total recorded revenue from bookings marked 'paid' or 'deposit_paid'
    const revenueRow = db.prepare(`
      SELECT SUM(total_price) as total_revenue
      FROM bookings
      WHERE payment_status IN ('paid', 'deposit_paid')
    `).get() as { total_revenue: number | null };

    // Recent 10 booking activities
    const recentBookings = db.prepare(`
      SELECT id, booking_reference, customer_name, service_name, start_time, end_time, total_price, booking_status, created_at
      FROM bookings
      ORDER BY id DESC
      LIMIT 10
    `).all();

    // Recent audit logs
    const recentAuditLogs = db.prepare(`
      SELECT id, actor_name, action, entity_type, entity_id, details, created_at
      FROM audit_logs
      ORDER BY id DESC
      LIMIT 10
    `).all();

    return res.json({
      today: {
        date: todayKolkata,
        bookingsCount: todayStats.total_today || 0,
        occupiedHours: todayStats.occupied_hours_today || 0,
        todayValue: todayStats.total_today_value || 0
      },
      counts: {
        confirmed: statusMap['confirmed']?.count || 0,
        pending: statusMap['pending']?.count || 0,
        completed: statusMap['completed']?.count || 0,
        cancelled: statusMap['cancelled']?.count || 0,
        noShow: statusMap['no-show']?.count || 0,
        upcoming: upcomingCount.count || 0,
      },
      recordedRevenue: revenueRow.total_revenue || 0,
      totalOccupiedHours: (statusMap['confirmed']?.hours || 0) + (statusMap['completed']?.hours || 0),
      recentBookings,
      recentAuditLogs
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to calculate metrics' });
  }
});

// =========================================================================
// F. BOOKING MANAGEMENT (Search, Filter, Paginate, Export CSV)
// =========================================================================
adminRouter.get('/bookings', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, serviceId, staffId, startDate, endDate, page = 1, limit = 25 } = req.query;

    let query = 'SELECT b.*, s.name as staff_name FROM bookings b LEFT JOIN staff s ON b.assigned_staff_id = s.id WHERE 1=1';
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ` AND (b.booking_reference LIKE ? OR b.customer_name LIKE ? OR b.customer_email LIKE ? OR b.customer_phone LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      query += ` AND b.booking_status = ?`;
      params.push(status);
    }

    if (serviceId && typeof serviceId === 'string' && serviceId !== 'all') {
      query += ` AND b.service_id = ?`;
      params.push(Number(serviceId));
    }

    if (staffId && typeof staffId === 'string' && staffId !== 'all') {
      query += ` AND b.assigned_staff_id = ?`;
      params.push(Number(staffId));
    }

    if (startDate && typeof startDate === 'string') {
      query += ` AND b.start_time >= ?`;
      params.push(`${startDate}T00:00:00+05:30`);
    }

    if (endDate && typeof endDate === 'string') {
      query += ` AND b.start_time <= ?`;
      params.push(`${endDate}T23:59:59+05:30`);
    }

    // Count query
    const countQuery = query.replace('SELECT b.*, s.name as staff_name', 'SELECT COUNT(*) as total');
    const totalRow = db.prepare(countQuery).get(...params) as { total: number };

    // Pagination & sorting
    const offset = (Number(page) - 1) * Number(limit);
    query += ` ORDER BY b.start_time DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const bookings = db.prepare(query).all(...params) as any[];

    // Parse JSON addons
    const parsed = bookings.map(b => ({
      ...b,
      selected_addons: JSON.parse(b.selected_addons || '[]')
    }));

    return res.json({
      bookings: parsed,
      pagination: {
        total: totalRow.total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalRow.total / Number(limit))
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch bookings' });
  }
});

// CSV Export
adminRouter.get('/bookings/export-csv', (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookings = db.prepare(`
      SELECT 
        b.booking_reference, b.customer_name, b.customer_email, b.customer_phone,
        b.service_name, b.start_time, b.end_time, b.duration_hours,
        b.total_price, b.booking_status, b.payment_status,
        s.name as assigned_staff, b.created_at
      FROM bookings b
      LEFT JOIN staff s ON b.assigned_staff_id = s.id
      ORDER BY b.start_time DESC
    `).all() as any[];

    const headers = [
      'Reference', 'Customer Name', 'Email', 'Phone',
      'Service', 'Start Time (IST)', 'End Time (IST)', 'Duration (Hrs)',
      'Total (INR)', 'Booking Status', 'Payment Status', 'Assigned Staff', 'Created At'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = bookings.map(b => [
      escapeCsv(b.booking_reference),
      escapeCsv(b.customer_name),
      escapeCsv(b.customer_email),
      escapeCsv(b.customer_phone),
      escapeCsv(b.service_name),
      escapeCsv(b.start_time),
      escapeCsv(b.end_time),
      escapeCsv(b.duration_hours),
      escapeCsv(b.total_price),
      escapeCsv(b.booking_status),
      escapeCsv(b.payment_status),
      escapeCsv(b.assigned_staff || 'Unassigned'),
      escapeCsv(b.created_at),
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="content_munch_bookings_${new Date().toISOString().slice(0, 10)}.csv"`);
    logAuditEvent(req.user!.name, 'EXPORT_CSV', 'bookings');
    return res.send(csvContent);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Single Booking Details
adminRouter.get('/bookings/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const booking = db.prepare(`
    SELECT b.*, s.name as staff_name, s.email as staff_email
    FROM bookings b
    LEFT JOIN staff s ON b.assigned_staff_id = s.id
    WHERE b.id = ?
  `).get(id) as any;

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  return res.json({
    booking: {
      ...booking,
      selected_addons: JSON.parse(booking.selected_addons || '[]')
    }
  });
});

// Status Update
adminRouter.patch('/bookings/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { status, cancellationReason, paymentStatus, internalNotes } = req.body;

  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE bookings 
    SET 
      booking_status = COALESCE(?, booking_status),
      cancellation_reason = COALESCE(?, cancellation_reason),
      payment_status = COALESCE(?, payment_status),
      internal_notes = COALESCE(?, internal_notes),
      updated_at = ?
    WHERE id = ?
  `).run(status || null, cancellationReason || null, paymentStatus || null, internalNotes || null, now, id);

  logAuditEvent(req.user!.name, 'UPDATE_BOOKING_STATUS', 'bookings', id, {
    oldStatus: existing.booking_status,
    newStatus: status || existing.booking_status,
    paymentStatus: paymentStatus || existing.payment_status,
    cancellationReason
  });

  return res.json({ message: 'Booking status updated successfully' });
});

// =========================================================================
// ATOMIC RESCHEDULING (CONCURRENCY-SAFE)
// =========================================================================
adminRouter.post('/bookings/:id/reschedule', (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { date, startTime, durationHours } = req.body;

  if (!date || !startTime) {
    return res.status(400).json({ error: 'New date (YYYY-MM-DD) and startTime (HH:MM) are required.' });
  }

  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const duration = durationHours ? Number(durationHours) : existing.duration_hours;
  const [sH, sM] = startTime.split(':').map(Number);
  const totalStart = sH * 60 + sM;
  const totalEnd = totalStart + Math.round(duration * 60);

  const eH = String(Math.floor(totalEnd / 60)).padStart(2, '0');
  const eM = String(totalEnd % 60).padStart(2, '0');
  const endTime = `${eH}:${eM}`;

  const startISO = `${date}T${startTime}:00+05:30`;
  const endISO = `${date}T${endTime}:00+05:30`;

  const startMs = new Date(startISO).getTime();
  const endMs = new Date(endISO).getTime();

  // Settings
  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const settings = new Map(settingsRows.map(r => [r.key, r.value]));
  const bufferMinutes = parseInt(settings.get('setup_cleanup_buffer_minutes') || '15', 10);
  const startWithBufMs = startMs - (bufferMinutes * 60 * 1000);
  const endWithBufMs = endMs + (bufferMinutes * 60 * 1000);

  // Atomic rescheduling transaction
  try {
    const rescheduleTransaction = db.transaction(() => {
      const dayEndISO = `${date}T23:59:59+05:30`;
      const dayStartISO = `${date}T00:00:00+05:30`;
      const conflicts = db.prepare(`
        SELECT id, booking_reference, start_time, end_time 
        FROM bookings
        WHERE resource_id = ?
          AND id != ?
          AND booking_status IN ('confirmed', 'pending')
          AND start_time <= ?
          AND end_time >= ?
      `).all(existing.resource_id, id, dayEndISO, dayStartISO) as any[];

      for (const c of conflicts) {
        const cStartMs = new Date(c.start_time).getTime();
        const cEndMs = new Date(c.end_time).getTime();
        if (Math.max(startWithBufMs, cStartMs) < Math.min(endWithBufMs, cEndMs)) {
          throw new Error('RESCHEDULE_CONFLICT');
        }
      }

      // Check blocked dates
      const blocked = db.prepare(`
        SELECT reason, start_time, end_time FROM blocked_dates
        WHERE start_time < ? AND end_time > ?
      `).all(endISO, startISO) as any[];

      for (const b of blocked) {
        const bStartMs = new Date(b.start_time).getTime();
        const bEndMs = new Date(b.end_time).getTime();
        if (Math.max(startMs, bStartMs) < Math.min(endMs, bEndMs)) {
          throw new Error(`STUDIO_BLOCKED:${b.reason}`);
        }
      }

      const now = new Date().toISOString();
      db.prepare(`
        UPDATE bookings
        SET 
          start_time = ?,
          end_time = ?,
          duration_hours = ?,
          booking_status = 'confirmed',
          updated_at = ?
        WHERE id = ?
      `).run(startISO, endISO, duration, now, id);

      logAuditEvent(req.user!.name, 'RESCHEDULE_BOOKING', 'bookings', id, {
        reference: existing.booking_reference,
        oldStart: existing.start_time,
        newStart: startISO,
        newEnd: endISO
      });

      return { success: true, startISO, endISO };
    });

    const result = rescheduleTransaction();
    return res.json({
      message: 'Booking rescheduled successfully.',
      ...result
    });
  } catch (err: any) {
    if (err.message === 'RESCHEDULE_CONFLICT') {
      return res.status(409).json({ error: 'Conflict: That time slot is already reserved by another booking.' });
    }
    if (err.message.startsWith('STUDIO_BLOCKED:')) {
      return res.status(409).json({ error: `Conflict: Studio is blocked for maintenance (${err.message.split('STUDIO_BLOCKED:')[1]}).` });
    }
    return res.status(500).json({ error: err.message || 'Rescheduling failed.' });
  }
});

// Assign Staff Member
adminRouter.post('/bookings/:id/assign', (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { staffId } = req.body;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  let staffName: string | null = null;
  if (staffId) {
    const staff = db.prepare('SELECT * FROM staff WHERE id = ? AND is_active = 1').get(Number(staffId)) as any;
    if (!staff) {
      return res.status(400).json({ error: 'Staff member not found or inactive.' });
    }
    staffName = staff.name;

    // Check staff overlap
    const staffConflicts = db.prepare(`
      SELECT id, booking_reference FROM bookings
      WHERE assigned_staff_id = ?
        AND id != ?
        AND booking_status IN ('confirmed', 'pending')
        AND start_time < ?
        AND end_time > ?
    `).all(staff.id, id, booking.end_time, booking.start_time);

    if (staffConflicts.length > 0) {
      return res.status(409).json({
        error: `Staff conflict: ${staff.name} is already assigned to another session during this time.`
      });
    }
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE bookings 
    SET assigned_staff_id = ?, assigned_staff_name = ?, updated_at = ?
    WHERE id = ?
  `).run(staffId ? Number(staffId) : null, staffName, now, id);

  logAuditEvent(req.user!.name, 'ASSIGN_STAFF', 'bookings', id, { staffId, staffName });
  return res.json({ message: 'Staff assigned successfully', assignedStaffName: staffName });
});

// Create Manual Reservation by Admin
adminRouter.post('/bookings/manual', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      serviceId,
      date,
      startTime,
      durationHours,
      addonIds,
      customerName,
      customerEmail,
      customerPhone,
      assignedStaffId,
      internalNotes,
      paymentStatus
    } = req.body;

    if (!serviceId || !date || !startTime || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ error: 'Missing required reservation fields.' });
    }

    const duration = parseFloat(String(durationHours || '1.0'));
    const [sH, sM] = startTime.split(':').map(Number);
    const totalStart = sH * 60 + sM;
    const totalEnd = totalStart + Math.round(duration * 60);

    const eH = String(Math.floor(totalEnd / 60)).padStart(2, '0');
    const eM = String(totalEnd % 60).padStart(2, '0');
    const endTime = `${eH}:${eM}`;

    const startISO = `${date}T${startTime}:00+05:30`;
    const endISO = `${date}T${endTime}:00+05:30`;

    const startMs = new Date(startISO).getTime();
    const endMs = new Date(endISO).getTime();

    // Settings
    const settingsRows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
    const settings = new Map(settingsRows.map(r => [r.key, r.value]));
    const bufferMinutes = parseInt(settings.get('setup_cleanup_buffer_minutes') || '15', 10);
    const startWithBufMs = startMs - (bufferMinutes * 60 * 1000);
    const endWithBufMs = endMs + (bufferMinutes * 60 * 1000);

    // Concurrency transaction
    const manualTransaction = db.transaction(() => {
      const dayEndISO = `${date}T23:59:59+05:30`;
      const dayStartISO = `${date}T00:00:00+05:30`;
      const conflicts = db.prepare(`
        SELECT id, booking_reference, start_time, end_time FROM bookings
        WHERE resource_id = 1
          AND booking_status IN ('confirmed', 'pending')
          AND start_time <= ?
          AND end_time >= ?
      `).all(dayEndISO, dayStartISO) as any[];

      for (const c of conflicts) {
        const cStartMs = new Date(c.start_time).getTime();
        const cEndMs = new Date(c.end_time).getTime();
        if (Math.max(startWithBufMs, cStartMs) < Math.min(endWithBufMs, cEndMs)) {
          throw new Error('MANUAL_CONFLICT');
        }
      }

      const pricing = calculateBookingPrice(Number(serviceId), duration, addonIds || []);
      const service = db.prepare('SELECT name FROM services WHERE id = ?').get(serviceId) as { name: string };

      // Upsert customer
      let cust = db.prepare('SELECT id FROM customers WHERE LOWER(email) = LOWER(?)').get(customerEmail) as any;
      let customerId: number;
      const now = new Date().toISOString();

      if (cust) {
        customerId = cust.id;
      } else {
        const cIns = db.prepare('INSERT INTO customers (name, email, phone, created_at) VALUES (?, ?, ?, ?)').run(customerName, customerEmail, customerPhone, now);
        customerId = Number(cIns.lastInsertRowid);
      }

      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const ref = `CM-${date.replace(/-/g, '')}-${rand}`;

      let staffName: string | null = null;
      if (assignedStaffId) {
        const staff = db.prepare('SELECT name FROM staff WHERE id = ?').get(assignedStaffId) as any;
        if (staff) staffName = staff.name;
      }

      const ins = db.prepare(`
        INSERT INTO bookings (
          booking_reference, customer_id, customer_name, customer_email, customer_phone,
          service_id, service_name, resource_id, start_time, end_time, duration_hours,
          selected_addons, base_price, addons_price, tax_amount, total_price,
          booking_status, payment_status, assigned_staff_id, assigned_staff_name,
          internal_notes, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, 1, ?, ?, ?,
          ?, ?, ?, ?, ?,
          'confirmed', ?, ?, ?,
          ?, ?, ?
        )
      `).run(
        ref, customerId, customerName, customerEmail, customerPhone,
        serviceId, service.name, startISO, endISO, duration,
        JSON.stringify(pricing.addons), pricing.basePrice, pricing.addonsPrice, pricing.taxAmount, pricing.totalPrice,
        paymentStatus || 'unpaid', assignedStaffId ? Number(assignedStaffId) : null, staffName,
        internalNotes || 'Admin manual reservation', now, now
      );

      const bookingId = Number(ins.lastInsertRowid);
      logAuditEvent(req.user!.name, 'CREATE_MANUAL_BOOKING', 'bookings', bookingId, { reference: ref, total: pricing.totalPrice });

      return { id: bookingId, bookingReference: ref };
    });

    const result = manualTransaction();
    return res.status(201).json({ message: 'Manual reservation created successfully', ...result });
  } catch (err: any) {
    if (err.message === 'MANUAL_CONFLICT') {
      return res.status(409).json({ error: 'Time slot conflicts with an existing booking.' });
    }
    return res.status(500).json({ error: err.message || 'Failed to create manual reservation' });
  }
});

// =========================================================================
// C. CALENDAR EVENTS (Day, Week, Month view)
// =========================================================================
adminRouter.get('/calendar-events', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { start, end } = req.query; // ISO or YYYY-MM-DD
    let query = `
      SELECT 
        b.id, b.booking_reference, b.customer_name, b.customer_phone,
        b.service_name, b.start_time, b.end_time, b.duration_hours,
        b.booking_status, b.payment_status, b.total_price,
        b.assigned_staff_name
      FROM bookings b
      WHERE b.booking_status != 'cancelled'
    `;
    const params: any[] = [];

    if (start && typeof start === 'string') {
      query += ` AND b.start_time >= ?`;
      params.push(start.includes('T') ? start : `${start}T00:00:00+05:30`);
    }

    if (end && typeof end === 'string') {
      query += ` AND b.start_time <= ?`;
      params.push(end.includes('T') ? end : `${end}T23:59:59+05:30`);
    }

    const bookings = db.prepare(query).all(...params);

    // Blocked dates in range
    const blocked = db.prepare(`SELECT * FROM blocked_dates`).all();

    return res.json({ bookings, blockedDates: blocked });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// =========================================================================
// D. OPERATING HOURS & EXCEPTIONS
// =========================================================================
adminRouter.get('/operating-hours', (req: AuthenticatedRequest, res: Response) => {
  const hours = db.prepare('SELECT * FROM operating_hours ORDER BY day_of_week ASC').all();
  return res.json(hours);
});

adminRouter.put('/operating-hours', requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { hours } = req.body;
  if (!Array.isArray(hours)) {
    return res.status(400).json({ error: 'Expected array of operating hours' });
  }

  const updateStmt = db.prepare(`
    UPDATE operating_hours
    SET open_time = ?, close_time = ?, is_open = ?
    WHERE day_of_week = ?
  `);

  const runUpdates = db.transaction(() => {
    for (const h of hours) {
      updateStmt.run(h.open_time, h.close_time, h.is_open ? 1 : 0, h.day_of_week);
    }
  });

  runUpdates();
  logAuditEvent(req.user!.name, 'UPDATE_OPERATING_HOURS', 'operating_hours', undefined, { hoursCount: hours.length });
  return res.json({ message: 'Operating hours updated successfully' });
});

// Blocked Dates CRUD
adminRouter.get('/blocked-dates', (req: AuthenticatedRequest, res: Response) => {
  const blocks = db.prepare('SELECT * FROM blocked_dates ORDER BY start_time DESC').all();
  return res.json(blocks);
});

adminRouter.post('/blocked-dates', requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { startTime, endTime, reason } = req.body;
  if (!startTime || !endTime || !reason) {
    return res.status(400).json({ error: 'startTime, endTime, and reason are required.' });
  }

  const now = new Date().toISOString();
  const ins = db.prepare(`
    INSERT INTO blocked_dates (start_time, end_time, reason, created_by, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(startTime, endTime, reason, req.user!.name, now);

  logAuditEvent(req.user!.name, 'ADD_BLOCKED_DATE', 'blocked_dates', Number(ins.lastInsertRowid), { reason, startTime, endTime });
  return res.status(201).json({ message: 'Studio blocked interval saved', id: ins.lastInsertRowid });
});

adminRouter.delete('/blocked-dates/:id', requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM blocked_dates WHERE id = ?').run(id);
  logAuditEvent(req.user!.name, 'DELETE_BLOCKED_DATE', 'blocked_dates', id);
  return res.json({ message: 'Blocked date removed' });
});

// =========================================================================
// E. STAFF MANAGEMENT
// =========================================================================
adminRouter.get('/staff', (req: AuthenticatedRequest, res: Response) => {
  const staff = db.prepare('SELECT * FROM staff ORDER BY id ASC').all();
  return res.json(staff);
});

adminRouter.post('/staff', requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phone, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const now = new Date().toISOString();
  try {
    const ins = db.prepare(`
      INSERT INTO staff (name, email, phone, role, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(name, email, phone || null, role || 'operator', now);

    logAuditEvent(req.user!.name, 'CREATE_STAFF', 'staff', Number(ins.lastInsertRowid), { name, email });
    return res.status(201).json({ message: 'Staff member added', id: ins.lastInsertRowid });
  } catch (err: any) {
    return res.status(400).json({ error: 'Staff member with this email already exists.' });
  }
});

adminRouter.put('/staff/:id', requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { name, email, phone, role, is_active } = req.body;

  db.prepare(`
    UPDATE staff 
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        role = COALESCE(?, role),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name, email, phone, role, is_active !== undefined ? (is_active ? 1 : 0) : null, id);

  logAuditEvent(req.user!.name, 'UPDATE_STAFF', 'staff', id);
  return res.json({ message: 'Staff member updated' });
});

// =========================================================================
// G. CUSTOMER DIRECTORY
// =========================================================================
adminRouter.get('/customers', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        c.*, 
        COUNT(b.id) as total_bookings,
        SUM(CASE WHEN b.booking_status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
        SUM(CASE WHEN b.booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_sessions,
        MAX(b.start_time) as last_booking_time
      FROM customers c
      LEFT JOIN bookings b ON c.id = b.customer_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` GROUP BY c.id ORDER BY c.id DESC LIMIT 100`;
    const customers = db.prepare(query).all(...params);
    return res.json(customers);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch customer directory' });
  }
});

// =========================================================================
// H. SERVICES & PRICING CONFIGURATION (Admin CRUD)
// =========================================================================
adminRouter.get('/services', (req: AuthenticatedRequest, res: Response) => {
  const services = db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
  return res.json(services);
});

adminRouter.post('/services', requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { name, slug, description, baseHourlyRate, minDurationHours, sortOrder } = req.body;
  if (!name || !baseHourlyRate) {
    return res.status(400).json({ error: 'Service name and base hourly rate are required.' });
  }

  const sSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  try {
    const ins = db.prepare(`
      INSERT INTO services (name, slug, description, base_hourly_rate, min_duration_hours, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(name, sSlug, description || '', Number(baseHourlyRate), Number(minDurationHours || 1.0), Number(sortOrder || 0));

    logAuditEvent(req.user!.name, 'CREATE_SERVICE', 'services', Number(ins.lastInsertRowid), { name, baseHourlyRate });
    return res.status(201).json({ message: 'Service created successfully', id: ins.lastInsertRowid });
  } catch (err: any) {
    return res.status(400).json({ error: 'Service slug already exists or invalid data' });
  }
});

adminRouter.put('/services/:id', requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { name, description, base_hourly_rate, min_duration_hours, is_active, sort_order } = req.body;

  db.prepare(`
    UPDATE services
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        base_hourly_rate = COALESCE(?, base_hourly_rate),
        min_duration_hours = COALESCE(?, min_duration_hours),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(name, description, base_hourly_rate, min_duration_hours, is_active, sort_order, id);

  logAuditEvent(req.user!.name, 'UPDATE_SERVICE', 'services', id, { name, base_hourly_rate });
  return res.json({ message: 'Service updated successfully' });
});

// Addons CRUD
adminRouter.get('/addons', (req: AuthenticatedRequest, res: Response) => {
  const addons = db.prepare('SELECT * FROM addons ORDER BY id ASC').all();
  return res.json(addons);
});

adminRouter.post('/addons', requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { name, description, priceType, price } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const ins = db.prepare(`
    INSERT INTO addons (name, description, price_type, price, is_active)
    VALUES (?, ?, ?, ?, 1)
  `).run(name, description || '', priceType || 'flat', Number(price));

  logAuditEvent(req.user!.name, 'CREATE_ADDON', 'addons', Number(ins.lastInsertRowid), { name, price });
  return res.status(201).json({ message: 'Addon created', id: ins.lastInsertRowid });
});

adminRouter.put('/addons/:id', requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { name, description, price_type, price, is_active } = req.body;

  db.prepare(`
    UPDATE addons
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        price_type = COALESCE(?, price_type),
        price = COALESCE(?, price),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name, description, price_type, price, is_active, id);

  logAuditEvent(req.user!.name, 'UPDATE_ADDON', 'addons', id);
  return res.json({ message: 'Addon updated' });
});

// Settings Management
adminRouter.get('/settings', (req: AuthenticatedRequest, res: Response) => {
  const settings = db.prepare('SELECT * FROM settings').all();
  return res.json(settings);
});

adminRouter.put('/settings', requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { settings } = req.body; // Array of { key, value }
  if (!Array.isArray(settings)) {
    return res.status(400).json({ error: 'Expected array of { key, value }' });
  }

  const now = new Date().toISOString();
  const updateStmt = db.prepare(`
    UPDATE settings SET value = ?, updated_at = ? WHERE key = ?
  `);

  const runTx = db.transaction(() => {
    for (const item of settings) {
      updateStmt.run(String(item.value), now, item.key);
    }
  });

  runTx();
  logAuditEvent(req.user!.name, 'UPDATE_SETTINGS', 'settings', undefined, { updatedKeys: settings.map(s => s.key) });
  return res.json({ message: 'Settings updated successfully' });
});

// =========================================================================
// I. AUDIT LOGS & REPORTING
// =========================================================================
adminRouter.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  const { limit = 50 } = req.query;
  const logs = db.prepare(`
    SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?
  `).all(Number(limit));
  return res.json(logs);
});

// Reports: utilization and recorded revenue
adminRouter.get('/reports', (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate } = req.query;
  const sDate = startDate ? `${startDate}T00:00:00+05:30` : '2026-01-01T00:00:00+05:30';
  const eDate = endDate ? `${endDate}T23:59:59+05:30` : '2026-12-31T23:59:59+05:30';

  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total_reservations,
      SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
      SUM(CASE WHEN booking_status = 'completed' THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
      SUM(duration_hours) as total_duration_hours,
      SUM(total_price) as gross_booking_value,
      SUM(CASE WHEN payment_status = 'paid' THEN total_price ELSE 0 END) as collected_revenue
    FROM bookings
    WHERE start_time >= ? AND start_time <= ?
  `).get(sDate, eDate);

  const serviceBreakdown = db.prepare(`
    SELECT service_name, COUNT(*) as bookings_count, SUM(total_price) as total_value, SUM(duration_hours) as hours
    FROM bookings
    WHERE start_time >= ? AND start_time <= ? AND booking_status != 'cancelled'
    GROUP BY service_name
    ORDER BY bookings_count DESC
  `).all(sDate, eDate);

  return res.json({ summary, serviceBreakdown });
});
