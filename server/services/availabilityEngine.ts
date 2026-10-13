import { db } from '../db.js';

export interface TimeSlot {
  startTime: string;       // "09:00"
  endTime: string;         // "11:00"
  startISO: string;        // Full ISO string in Asia/Kolkata
  endISO: string;          // Full ISO string in Asia/Kolkata
  isAvailable: boolean;
  unavailabilityReason?: string;
}

export interface DayAvailabilityResponse {
  date: string;            // "YYYY-MM-DD"
  dayOfWeek: number;
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  timezone: string;
  bufferMinutes: number;
  minDurationHours: number;
  slots: TimeSlot[];
}

/**
 * Helper to parse "YYYY-MM-DD" and "HH:MM" in Asia/Kolkata (+05:30)
 */
export function createKolkataISO(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00+05:30`;
}

/**
 * Get current time in Asia/Kolkata as a Date object or timestamp
 */
export function getNowInKolkata(): { dateStr: string; timeStr: string; timestamp: number } {
  const now = new Date();
  // Format in Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }
  const dateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const timeStr = `${partMap.hour}:${partMap.minute}`;
  const kolkataISO = `${dateStr}T${timeStr}:${partMap.second}+05:30`;
  const timestamp = new Date(kolkataISO).getTime();

  return { dateStr, timeStr, timestamp };
}

/**
 * Computes available start times for a specific date and duration
 */
export function getAvailableSlotsForDate(
  dateStr: string,           // "YYYY-MM-DD"
  durationHours: number = 1.0,
  resourceId: number = 1,
  staffId?: number
): DayAvailabilityResponse {
  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.');
  }

  // Parse day of week for this date in Asia/Kolkata
  const targetDate = new Date(`${dateStr}T00:00:00+05:30`);
  const dayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday...

  // Fetch settings
  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const settings = new Map(settingsRows.map(r => [r.key, r.value]));

  const timezone = settings.get('studio_timezone') || 'Asia/Kolkata';
  const bufferMinutes = parseInt(settings.get('setup_cleanup_buffer_minutes') || '15', 10);
  const minNoticeHours = parseFloat(settings.get('min_advance_notice_hours') || '2');
  const maxAdvanceDays = parseInt(settings.get('max_advance_booking_days') || '60', 10);

  // Fetch operating hours for this day of week
  const opHours = db.prepare('SELECT * FROM operating_hours WHERE day_of_week = ?').get(dayOfWeek) as {
    day_name: string;
    open_time: string;
    close_time: string;
    is_open: number;
  } | undefined;

  const dayName = opHours ? opHours.day_name : 'Unknown';
  const isOpen = opHours ? Boolean(opHours.is_open) : false;
  const openTime = opHours ? opHours.open_time : '09:00';
  const closeTime = opHours ? opHours.close_time : '21:00';

  if (!isOpen) {
    return {
      date: dateStr,
      dayOfWeek,
      dayName,
      isOpen: false,
      openTime,
      closeTime,
      timezone,
      bufferMinutes,
      minDurationHours: durationHours,
      slots: []
    };
  }

  // Check advance notice and past date restrictions
  const nowKolkata = getNowInKolkata();
  const noticeCutoffTime = nowKolkata.timestamp + (minNoticeHours * 60 * 60 * 1000);
  const maxBookingCutoff = nowKolkata.timestamp + (maxAdvanceDays * 24 * 60 * 60 * 1000);

  // Fetch existing bookings for this resource that overlap this day
  // Booking start or end intersects with dateStr range
  const dayStartISO = `${dateStr}T00:00:00+05:30`;
  const dayEndISO = `${dateStr}T23:59:59+05:30`;

  const existingBookings = db.prepare(`
    SELECT id, start_time, end_time, assigned_staff_id, booking_status 
    FROM bookings
    WHERE resource_id = ?
      AND booking_status IN ('confirmed', 'pending')
      AND start_time < ?
      AND end_time > ?
  `).all(resourceId, dayEndISO, dayStartISO) as Array<{
    id: number;
    start_time: string;
    end_time: string;
    assigned_staff_id: number | null;
    booking_status: string;
  }>;

  // Fetch blocked dates / maintenance intervals
  const blockedIntervals = db.prepare(`
    SELECT start_time, end_time, reason 
    FROM blocked_dates
    WHERE start_time < ? AND end_time > ?
  `).all(dayEndISO, dayStartISO) as Array<{
    start_time: string;
    end_time: string;
    reason: string;
  }>;

  // Fetch staff bookings if staff member was specified
  let staffOverlaps: Array<{ start_time: string; end_time: string }> = [];
  if (staffId) {
    staffOverlaps = db.prepare(`
      SELECT start_time, end_time FROM bookings
      WHERE assigned_staff_id = ?
        AND booking_status IN ('confirmed', 'pending')
        AND start_time < ?
        AND end_time > ?
    `).all(staffId, dayEndISO, dayStartISO) as Array<{ start_time: string; end_time: string }>;
  }

  // Generate slots from open_time to close_time in 1-hour increments (or 30 mins)
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  const openMinutesTotal = openHour * 60 + openMin;
  const closeMinutesTotal = closeHour * 60 + closeMin;
  const durationMinutesTotal = Math.round(durationHours * 60);

  const slots: TimeSlot[] = [];

  // Hourly slot steps (e.g. 09:00, 10:00, 11:00...)
  const stepMinutes = 60; 

  for (let startM = openMinutesTotal; startM + durationMinutesTotal <= closeMinutesTotal; startM += stepMinutes) {
    const endM = startM + durationMinutesTotal;

    const sH = String(Math.floor(startM / 60)).padStart(2, '0');
    const sM = String(startM % 60).padStart(2, '0');
    const eH = String(Math.floor(endM / 60)).padStart(2, '0');
    const eM = String(endM % 60).padStart(2, '0');

    const startTimeFormatted = `${sH}:${sM}`;
    const endTimeFormatted = `${eH}:${eM}`;

    const slotStartISO = createKolkataISO(dateStr, startTimeFormatted);
    const slotEndISO = createKolkataISO(dateStr, endTimeFormatted);

    const slotStartMs = new Date(slotStartISO).getTime();
    const slotEndMs = new Date(slotEndISO).getTime();

    // With buffer:
    const slotStartWithBufferMs = slotStartMs - (bufferMinutes * 60 * 1000);
    const slotEndWithBufferMs = slotEndMs + (bufferMinutes * 60 * 1000);

    let isAvailable = true;
    let unavailabilityReason: string | undefined = undefined;

    // 1. Is this slot in the past or violates notice?
    if (slotStartMs <= nowKolkata.timestamp) {
      isAvailable = false;
      unavailabilityReason = 'Time has already passed';
    } else if (slotStartMs < noticeCutoffTime) {
      isAvailable = false;
      unavailabilityReason = `Requires ${minNoticeHours}h advance notice`;
    } else if (slotStartMs > maxBookingCutoff) {
      isAvailable = false;
      unavailabilityReason = `Beyond advance booking window (${maxAdvanceDays} days)`;
    }

    // 2. Check collision with existing bookings (including buffers)
    if (isAvailable) {
      for (const booking of existingBookings) {
        const bStartMs = new Date(booking.start_time).getTime();
        const bEndMs = new Date(booking.end_time).getTime();

        // Check if [slotStartWithBufferMs, slotEndWithBufferMs] intersects with [bStartMs, bEndMs]
        // Standard interval intersection: max(start1, start2) < min(end1, end2)
        if (Math.max(slotStartWithBufferMs, bStartMs) < Math.min(slotEndWithBufferMs, bEndMs)) {
          isAvailable = false;
          unavailabilityReason = 'Studio is booked during this time interval';
          break;
        }
      }
    }

    // 3. Check collision with blocked dates / maintenance
    if (isAvailable) {
      for (const block of blockedIntervals) {
        const blkStartMs = new Date(block.start_time).getTime();
        const blkEndMs = new Date(block.end_time).getTime();
        if (Math.max(slotStartMs, blkStartMs) < Math.min(slotEndMs, blkEndMs)) {
          isAvailable = false;
          unavailabilityReason = `Studio unavailable: ${block.reason}`;
          break;
        }
      }
    }

    // 4. Check staff availability if requested
    if (isAvailable && staffId) {
      for (const staffBooking of staffOverlaps) {
        const stStartMs = new Date(staffBooking.start_time).getTime();
        const stEndMs = new Date(staffBooking.end_time).getTime();
        if (Math.max(slotStartMs, stStartMs) < Math.min(slotEndMs, stEndMs)) {
          isAvailable = false;
          unavailabilityReason = 'Assigned staff operator is unavailable at this time';
          break;
        }
      }
    }

    slots.push({
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
      startISO: slotStartISO,
      endISO: slotEndISO,
      isAvailable,
      unavailabilityReason,
    });
  }

  return {
    date: dateStr,
    dayOfWeek,
    dayName,
    isOpen: true,
    openTime,
    closeTime,
    timezone,
    bufferMinutes,
    minDurationHours: durationHours,
    slots,
  };
}
