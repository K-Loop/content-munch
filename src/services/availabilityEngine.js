// Pure frontend timezone and slot availability calculation engine

import { 
  getStoredSettings, 
  getStoredOperatingHours, 
  getStoredBookings, 
  getStoredBlockedDates 
} from './storageService.js';

/**
 * Creates Asia/Kolkata ISO string (+05:30)
 */
export function createKolkataISO(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00+05:30`;
}

/**
 * Returns current timestamp and date/time formatted in Asia/Kolkata
 */
export function getNowInKolkata() {
  const now = new Date();
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
  const partMap = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }
  const dateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const timeStr = `${partMap.hour}:${partMap.minute}`;
  const kolkataISO = `${dateStr}T${timeStr}:${partMap.second || '00'}+05:30`;
  const timestamp = new Date(kolkataISO).getTime();

  return { dateStr, timeStr, timestamp };
}

/**
 * Computes available start times for a specific date and duration in the browser
 */
export function getAvailableSlotsForDate(
  dateStr,
  durationHours = 1.0,
  resourceId = 1,
  staffId = null,
  contextOverride = null
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.');
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  // Parse day of week for this date (using UTC to prevent local machine offset)
  const targetDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = targetDate.getUTCDay(); // 0=Sunday, 1=Monday...

  // Load configuration
  const settingsList = contextOverride?.settings || getStoredSettings();
  const operatingHoursList = contextOverride?.operatingHours || getStoredOperatingHours();
  const existingBookings = contextOverride?.bookings || getStoredBookings();
  const blockedIntervals = contextOverride?.blockedDates || getStoredBlockedDates();

  const settingsMap = new Map();
  if (Array.isArray(settingsList)) {
    for (const item of settingsList) {
      settingsMap.set(item.key, item.value);
    }
  } else if (typeof settingsList === 'object' && settingsList !== null) {
    for (const [k, v] of Object.entries(settingsList)) {
      settingsMap.set(k, v);
    }
  }

  const timezone = settingsMap.get('studio_timezone') || 'Asia/Kolkata';
  const bufferMinutes = parseInt(settingsMap.get('setup_cleanup_buffer_minutes') || '15', 10);
  const minNoticeHours = parseFloat(settingsMap.get('min_advance_notice_hours') || '2');
  const maxAdvanceDays = parseInt(settingsMap.get('max_advance_booking_days') || '60', 10);

  // Find operating hours for this day of week
  const opHours = operatingHoursList.find(h => Number(h.day_of_week) === Number(dayOfWeek));
  const dayName = opHours ? opHours.day_name : 'Unknown';
  const isOpen = opHours ? Boolean(Number(opHours.is_open)) : false;
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

  const nowKolkata = getNowInKolkata();
  const noticeCutoffTime = nowKolkata.timestamp + (minNoticeHours * 60 * 60 * 1000);
  const maxBookingCutoff = nowKolkata.timestamp + (maxAdvanceDays * 24 * 60 * 60 * 1000);

  const dayStartISO = `${dateStr}T00:00:00+05:30`;
  const dayEndISO = `${dateStr}T23:59:59+05:30`;

  // Filter relevant bookings for this day and resource
  const dayBookings = existingBookings.filter(b => {
    if (Number(b.resource_id) !== Number(resourceId)) return false;
    if (b.booking_status !== 'confirmed' && b.booking_status !== 'pending') return false;
    return b.start_time < dayEndISO && b.end_time > dayStartISO;
  });

  // Filter blocked dates for this day
  const dayBlocks = blockedIntervals.filter(b => {
    return b.start_time < dayEndISO && b.end_time > dayStartISO;
  });

  // Filter staff overlaps
  const staffOverlaps = staffId
    ? existingBookings.filter(b => {
        if (Number(b.assigned_staff_id) !== Number(staffId)) return false;
        if (b.booking_status !== 'confirmed' && b.booking_status !== 'pending') return false;
        return b.start_time < dayEndISO && b.end_time > dayStartISO;
      })
    : [];

  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  const openMinutesTotal = openHour * 60 + openMin;
  const closeMinutesTotal = closeHour * 60 + closeMin;
  const durationMinutesTotal = Math.round(durationHours * 60);

  const slots = [];
  const stepMinutes = 60; // Standard 1-hour slot intervals

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

    // Account for buffer
    const slotStartWithBufferMs = slotStartMs - (bufferMinutes * 60 * 1000);
    const slotEndWithBufferMs = slotEndMs + (bufferMinutes * 60 * 1000);

    let isAvailable = true;
    let unavailabilityReason = undefined;

    // 1. Past slot or advance notice violation
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

    // 2. Collision with existing bookings (including buffers)
    if (isAvailable) {
      for (const booking of dayBookings) {
        const bStartMs = new Date(booking.start_time).getTime();
        const bEndMs = new Date(booking.end_time).getTime();

        if (Math.max(slotStartWithBufferMs, bStartMs) < Math.min(slotEndWithBufferMs, bEndMs)) {
          isAvailable = false;
          unavailabilityReason = 'Studio is booked during this time interval';
          break;
        }
      }
    }

    // 3. Collision with maintenance/blocked dates
    if (isAvailable) {
      for (const block of dayBlocks) {
        const blkStartMs = new Date(block.start_time).getTime();
        const blkEndMs = new Date(block.end_time).getTime();
        if (Math.max(slotStartMs, blkStartMs) < Math.min(slotEndMs, blkEndMs)) {
          isAvailable = false;
          unavailabilityReason = `Studio unavailable: ${block.reason}`;
          break;
        }
      }
    }

    // 4. Staff collision if specified
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
      unavailabilityReason
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
    slots
  };
}
