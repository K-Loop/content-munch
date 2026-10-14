// Pure frontend booking management, metrics, and customer engine

import { 
  getStoredBookings, 
  saveStoredBookings, 
  getStoredServices, 
  getStoredStaff, 
  getStoredBlockedDates, 
  getStoredSettings, 
  appendStoredAuditLog 
} from './storageService.js';
import { calculateBookingPrice } from './pricingEngine.js';
import { createKolkataISO, getNowInKolkata } from './availabilityEngine.js';

/**
 * Generate unique booking reference in the browser: CM-YYYYMMDD-XXXX
 */
export function generateBookingReference(dateStr) {
  const cleanDate = (dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CM-${cleanDate}-${rand}`;
}

/**
 * Checks if a requested interval overlaps with any active booking on the resource
 */
export function checkResourceConflict(
  resourceId, 
  startISO, 
  endISO, 
  excludeBookingId = null, 
  bufferMinutes = 15,
  bookingsList = null
) {
  const bookings = bookingsList || getStoredBookings();
  const cStartMs = new Date(startISO).getTime() - (bufferMinutes * 60 * 1000);
  const cEndMs = new Date(endISO).getTime() + (bufferMinutes * 60 * 1000);

  return bookings.some(b => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (Number(b.resource_id) !== Number(resourceId)) return false;
    if (b.booking_status !== 'confirmed' && b.booking_status !== 'pending') return false;

    const bStartMs = new Date(b.start_time).getTime();
    const bEndMs = new Date(b.end_time).getTime();

    // Standard interval overlap: max(start1, start2) < min(end1, end2)
    return Math.max(cStartMs, bStartMs) < Math.min(cEndMs, bEndMs);
  });
}

/**
 * Creates a new booking in localStorage with full validation and conflict rejection
 */
export function createFrontendBooking(payload) {
  const {
    serviceId,
    date,
    startTime,
    durationHours = 1,
    addonIds = [],
    customerName,
    customerEmail,
    customerPhone,
    customerNotes = '',
    resourceId = 1,
    paymentStatus = 'unpaid',
    assignedStaffId = null
  } = payload;

  if (!customerName || !customerEmail || !customerPhone) {
    throw new Error('Customer name, email, and phone number are required.');
  }

  // Calculate pricing quote
  const quote = calculateBookingPrice(serviceId, durationHours, addonIds);

  // Compute end time
  const [sH, sM] = startTime.split(':').map(Number);
  const totalMinutes = sH * 60 + sM + Math.round(quote.durationHours * 60);
  const eH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const eMinute = String(totalMinutes % 60).padStart(2, '0');
  const endTime = `${eH}:${eMinute}`;

  const startISO = createKolkataISO(date, startTime);
  const endISO = createKolkataISO(date, endTime);

  // Read settings for buffer
  const settingsList = getStoredSettings();
  const settingsMap = new Map(settingsList.map(s => [s.key, s.value]));
  const bufferMinutes = parseInt(settingsMap.get('setup_cleanup_buffer_minutes') || '15', 10);

  // Verify no overlap on resource
  const isConflicting = checkResourceConflict(resourceId, startISO, endISO, null, bufferMinutes);
  if (isConflicting) {
    const error = new Error('Conflict: The selected time slot is already booked. Please choose another time.');
    error.status = 409;
    throw error;
  }

  // Check blocked dates
  const blockedDates = getStoredBlockedDates();
  const slotStartMs = new Date(startISO).getTime();
  const slotEndMs = new Date(endISO).getTime();
  const isBlocked = blockedDates.some(blk => {
    const bStartMs = new Date(blk.start_time).getTime();
    const bEndMs = new Date(blk.end_time).getTime();
    return Math.max(slotStartMs, bStartMs) < Math.min(slotEndMs, bEndMs);
  });

  if (isBlocked) {
    const error = new Error('Studio is closed for maintenance during this time.');
    error.status = 409;
    throw error;
  }

  // Staff info if assigned
  let staffName = null;
  if (assignedStaffId) {
    const staffList = getStoredStaff();
    const st = staffList.find(s => Number(s.id) === Number(assignedStaffId));
    if (st) staffName = st.name;
  }

  const bookingRef = generateBookingReference(date);
  const now = new Date().toISOString();

  const newBooking = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    booking_reference: bookingRef,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    service_id: Number(serviceId),
    service_name: quote.serviceName,
    resource_id: Number(resourceId),
    start_time: startISO,
    end_time: endISO,
    duration_hours: quote.durationHours,
    selected_addons: JSON.stringify(addonIds),
    base_price: quote.basePrice,
    addons_price: quote.addonsPrice,
    tax_amount: quote.taxAmount,
    total_price: quote.totalPrice,
    booking_status: 'confirmed',
    payment_status: paymentStatus,
    assigned_staff_id: assignedStaffId ? Number(assignedStaffId) : null,
    assigned_staff_name: staffName,
    customer_notes: customerNotes,
    internal_notes: '',
    cancellation_reason: null,
    created_at: now,
    updated_at: now
  };

  const currentBookings = getStoredBookings();
  currentBookings.unshift(newBooking);
  saveStoredBookings(currentBookings);

  appendStoredAuditLog('create_booking', {
    reference: bookingRef,
    customer: customerName,
    service: quote.serviceName,
    date,
    startTime
  });

  return {
    booking: {
      ...newBooking,
      bookingReference: newBooking.booking_reference,
      serviceName: newBooking.service_name,
      date,
      startTime,
      endTime,
      pricing: quote
    }
  };
}

/**
 * Lookup single booking by booking_reference
 */
export function lookupFrontendBooking(reference) {
  if (!reference) throw new Error('Reference is required');
  const clean = reference.trim().toUpperCase();
  const bookings = getStoredBookings();
  const found = bookings.find(b => b.booking_reference.toUpperCase() === clean);
  if (!found) {
    const error = new Error(`No booking found matching reference "${reference}".`);
    error.status = 404;
    throw error;
  }
  return { booking: found };
}

/**
 * Reschedule booking with conflict check
 */
export function rescheduleFrontendBooking(id, newDate, newStartTime) {
  const bookings = getStoredBookings();
  const index = bookings.findIndex(b => Number(b.id) === Number(id));
  if (index === -1) {
    throw new Error(`Booking with ID ${id} not found.`);
  }

  const booking = bookings[index];
  const durationHours = booking.duration_hours;

  const [sH, sM] = newStartTime.split(':').map(Number);
  const totalMinutes = sH * 60 + sM + Math.round(durationHours * 60);
  const eH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const eMinute = String(totalMinutes % 60).padStart(2, '0');
  const newEndTime = `${eH}:${eMinute}`;

  const newStartISO = createKolkataISO(newDate, newStartTime);
  const newEndISO = createKolkataISO(newDate, newEndTime);

  // Settings buffer
  const settingsList = getStoredSettings();
  const settingsMap = new Map(settingsList.map(s => [s.key, s.value]));
  const bufferMinutes = parseInt(settingsMap.get('setup_cleanup_buffer_minutes') || '15', 10);

  // Conflict check excluding current booking
  const conflict = checkResourceConflict(booking.resource_id, newStartISO, newEndISO, booking.id, bufferMinutes, bookings);
  if (conflict) {
    const error = new Error('Conflict: Requested rescheduling slot overlaps with an existing booking.');
    error.status = 409;
    throw error;
  }

  booking.start_time = newStartISO;
  booking.end_time = newEndISO;
  booking.booking_status = 'confirmed';
  booking.updated_at = new Date().toISOString();

  bookings[index] = booking;
  saveStoredBookings(bookings);

  appendStoredAuditLog('reschedule_booking', {
    id,
    reference: booking.booking_reference,
    newDate,
    newStartTime
  });

  return { booking };
}

/**
 * Update booking status ('confirmed' | 'cancelled' | 'completed' | 'no-show' | 'pending')
 */
export function updateFrontendBookingStatus(id, newStatus, reason = '') {
  const bookings = getStoredBookings();
  const index = bookings.findIndex(b => Number(b.id) === Number(id));
  if (index === -1) {
    throw new Error(`Booking with ID ${id} not found.`);
  }

  const booking = bookings[index];
  booking.booking_status = newStatus;
  if (reason) booking.cancellation_reason = reason;
  booking.updated_at = new Date().toISOString();

  bookings[index] = booking;
  saveStoredBookings(bookings);

  appendStoredAuditLog('update_booking_status', {
    id,
    reference: booking.booking_reference,
    status: newStatus,
    reason
  });

  return { booking };
}

/**
 * Assign staff operator to booking
 */
export function assignStaffToBooking(bookingId, staffId) {
  const bookings = getStoredBookings();
  const index = bookings.findIndex(b => Number(b.id) === Number(bookingId));
  if (index === -1) {
    throw new Error(`Booking with ID ${bookingId} not found.`);
  }

  const staffList = getStoredStaff();
  let staffName = null;
  if (staffId) {
    const staff = staffList.find(s => Number(s.id) === Number(staffId));
    if (staff) staffName = staff.name;
  }

  const booking = bookings[index];
  booking.assigned_staff_id = staffId ? Number(staffId) : null;
  booking.assigned_staff_name = staffName;
  booking.updated_at = new Date().toISOString();

  bookings[index] = booking;
  saveStoredBookings(bookings);

  appendStoredAuditLog('assign_staff', {
    bookingId,
    staffId,
    staffName
  });

  return { booking };
}

/**
 * Get dashboard metrics calculated from localStorage bookings
 */
export function getDashboardMetrics() {
  const bookings = getStoredBookings();
  const nowKolkata = getNowInKolkata();
  const todayStr = nowKolkata.dateStr;

  const counts = {
    confirmed: 0,
    pending: 0,
    completed: 0,
    cancelled: 0
  };

  let recordedRevenue = 0;
  let totalOccupiedHours = 0;
  let todayCount = 0;
  let todayHours = 0;

  for (const b of bookings) {
    if (counts[b.booking_status] !== undefined) {
      counts[b.booking_status]++;
    }

    if (b.booking_status !== 'cancelled') {
      recordedRevenue += Number(b.total_price) || 0;
      totalOccupiedHours += Number(b.duration_hours) || 0;
    }

    if (b.start_time && b.start_time.startsWith(todayStr)) {
      todayCount++;
      if (b.booking_status !== 'cancelled') {
        todayHours += Number(b.duration_hours) || 0;
      }
    }
  }

  return {
    today: {
      date: todayStr,
      bookingsCount: todayCount,
      occupiedHours: todayHours
    },
    counts,
    recordedRevenue,
    totalOccupiedHours,
    recentBookings: bookings.slice(0, 10)
  };
}

/**
 * Get filtered bookings with pagination
 */
export function getFilteredBookings(filters = {}) {
  const {
    search = '',
    status = 'all',
    staffId = 'all',
    page = 1,
    limit = 15
  } = filters;

  let list = getStoredBookings();

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(b => 
      (b.booking_reference && b.booking_reference.toLowerCase().includes(q)) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
      (b.customer_email && b.customer_email.toLowerCase().includes(q)) ||
      (b.customer_phone && b.customer_phone.toLowerCase().includes(q))
    );
  }

  if (status && status !== 'all') {
    list = list.filter(b => b.booking_status === status);
  }

  if (staffId && staffId !== 'all') {
    list = list.filter(b => Number(b.assigned_staff_id) === Number(staffId));
  }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(1, Number(page)), totalPages);
  const startIndex = (currentPage - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

  return {
    bookings: paginated,
    pagination: {
      total,
      page: currentPage,
      limit: Number(limit),
      totalPages
    }
  };
}

/**
 * Customers derived dynamically from actual local bookings
 */
export function getDerivedCustomers(search = '') {
  const bookings = getStoredBookings();
  const customerMap = new Map();

  for (const b of bookings) {
    const key = (b.customer_email || b.customer_phone || b.customer_name).toLowerCase();
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        id: key,
        name: b.customer_name,
        email: b.customer_email,
        phone: b.customer_phone,
        total_bookings: 0,
        completed_sessions: 0,
        cancelled_sessions: 0,
        last_booking_time: b.start_time
      });
    }

    const c = customerMap.get(key);
    c.total_bookings++;
    if (b.booking_status === 'completed') c.completed_sessions++;
    if (b.booking_status === 'cancelled') c.cancelled_sessions++;
    if (new Date(b.start_time).getTime() > new Date(c.last_booking_time).getTime()) {
      c.last_booking_time = b.start_time;
    }
  }

  let customers = Array.from(customerMap.values());

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    customers = customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  }

  return customers;
}

/**
 * Reports and utilization breakdown derived from localStorage bookings
 */
export function getReportsData(startDate = '', endDate = '') {
  let bookings = getStoredBookings();

  if (startDate) {
    bookings = bookings.filter(b => b.start_time >= `${startDate}T00:00:00+05:30`);
  }
  if (endDate) {
    bookings = bookings.filter(b => b.start_time <= `${endDate}T23:59:59+05:30`);
  }

  let totalReservations = bookings.length;
  let confirmedCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let grossBookingValue = 0;
  let totalDurationHours = 0;

  const serviceMap = new Map();

  for (const b of bookings) {
    if (b.booking_status === 'confirmed') confirmedCount++;
    if (b.booking_status === 'completed') completedCount++;
    if (b.booking_status === 'cancelled') cancelledCount++;

    if (b.booking_status !== 'cancelled') {
      grossBookingValue += Number(b.total_price) || 0;
      totalDurationHours += Number(b.duration_hours) || 0;
    }

    const sName = b.service_name || 'Studio Rental';
    if (!serviceMap.has(sName)) {
      serviceMap.set(sName, {
        service_name: sName,
        booking_count: 0,
        total_hours: 0,
        total_revenue: 0
      });
    }
    const sStat = serviceMap.get(sName);
    sStat.booking_count++;
    if (b.booking_status !== 'cancelled') {
      sStat.total_hours += Number(b.duration_hours) || 0;
      sStat.total_revenue += Number(b.total_price) || 0;
    }
  }

  return {
    summary: {
      total_reservations: totalReservations,
      confirmed_count: confirmedCount,
      completed_count: completedCount,
      cancelled_count: cancelledCount,
      gross_booking_value: grossBookingValue,
      total_duration_hours: totalDurationHours
    },
    serviceBreakdown: Array.from(serviceMap.values())
  };
}
