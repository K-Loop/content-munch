// Pure Frontend API Layer for Content Munch Studio
// Operates 100% in the browser using localStorage and local calculation services.
// No network requests or backend servers are used.

import {
  getStoredSettings,
  saveStoredSettings,
  getStoredOperatingHours,
  saveStoredOperatingHours,
  getStoredServices,
  saveStoredServices,
  getStoredAddons,
  saveStoredAddons,
  getStoredStaff,
  saveStoredStaff,
  getStoredBlockedDates,
  saveStoredBlockedDates,
  getStoredAuditLogs,
  appendStoredAuditLog,
  getStoredBookings,
  getStoredAdminSession,
  saveStoredAdminSession,
  resetAllLocalData
} from '../services/storageService.js';

import { calculateBookingPrice } from '../services/pricingEngine.js';
import { getAvailableSlotsForDate } from '../services/availabilityEngine.js';
import {
  createFrontendBooking,
  lookupFrontendBooking,
  rescheduleFrontendBooking,
  updateFrontendBookingStatus,
  assignStaffToBooking,
  getDashboardMetrics,
  getFilteredBookings,
  getDerivedCustomers,
  getReportsData
} from '../services/bookingService.js';

// =========================================================================
// AUTH / DEMO SESSION (No real credentials, strictly local demo)
// =========================================================================

export function getAdminToken() {
  const session = getStoredAdminSession();
  return session ? 'local-demo-token' : '';
}

export function setAdminToken(token) {
  if (token) {
    saveStoredAdminSession({
      name: 'Studio Director',
      email: 'admin@contentmunch.com',
      role: 'owner'
    });
  } else {
    saveStoredAdminSession(null);
  }
}

export async function adminLogin(email = 'admin@contentmunch.com', password = '') {
  // Pure local demo login without real server credentials
  const demoUser = {
    name: email.split('@')[0] ? email.split('@')[0].replace('.', ' ').toUpperCase() : 'Studio Director',
    email: email || 'admin@contentmunch.com',
    role: 'owner'
  };
  saveStoredAdminSession(demoUser);
  appendStoredAuditLog('demo_admin_login', { email: demoUser.email });
  return { user: demoUser, token: 'local-demo-token' };
}

export async function adminGetMe() {
  const session = getStoredAdminSession();
  if (!session) {
    throw new Error('No active local admin session.');
  }
  return { user: session };
}

// =========================================================================
// PUBLIC CLIENT API
// =========================================================================

export async function fetchStudioConfig() {
  const settingsList = getStoredSettings();
  const settingsObj = {};
  for (const s of settingsList) {
    settingsObj[s.key] = s.value;
  }

  return {
    services: getStoredServices(),
    addons: getStoredAddons(),
    settings: settingsObj,
    operatingHours: getStoredOperatingHours()
  };
}

export async function fetchAvailability(date, duration = 1, serviceId = null) {
  return getAvailableSlotsForDate(date, Number(duration) || 1, 1);
}

export async function calculateQuote(serviceId, durationHours, addonIds = []) {
  return calculateBookingPrice(serviceId, durationHours, addonIds);
}

export async function createBooking(payload) {
  return createFrontendBooking(payload);
}

export async function lookupBooking(reference) {
  return lookupFrontendBooking(reference);
}

// =========================================================================
// ADMIN PORTAL API (Pure local state & localStorage)
// =========================================================================

export async function adminGetMetrics() {
  return getDashboardMetrics();
}

export async function adminGetBookings(filters = {}) {
  return getFilteredBookings(filters);
}

export async function adminUpdateBookingStatus(id, updateData) {
  return updateFrontendBookingStatus(id, updateData.status, updateData.reason || '');
}

export async function adminRescheduleBooking(id, rescheduleData) {
  return rescheduleFrontendBooking(id, rescheduleData.newDate, rescheduleData.newStartTime);
}

export async function adminAssignStaff(id, staffId) {
  return assignStaffToBooking(id, staffId);
}

export async function adminCreateManualBooking(payload) {
  return createFrontendBooking(payload);
}

export async function adminGetCalendarEvents(start, end) {
  const allBookings = getStoredBookings();
  const blockedDates = getStoredBlockedDates();

  const filtered = allBookings.filter(b => {
    if (start && b.start_time < `${start}T00:00:00+05:30`) return false;
    if (end && b.start_time > `${end}T23:59:59+05:30`) return false;
    return true;
  });

  return {
    bookings: filtered,
    blockedDates
  };
}

export async function adminGetOperatingHours() {
  return getStoredOperatingHours();
}

export async function adminUpdateOperatingHours(hours) {
  saveStoredOperatingHours(hours);
  appendStoredAuditLog('update_operating_hours', { count: hours.length });
  return { success: true };
}

export async function adminGetBlockedDates() {
  return getStoredBlockedDates();
}

export async function adminAddBlockedDate(blockData) {
  const list = getStoredBlockedDates();
  const newBlock = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    start_time: blockData.startTime,
    end_time: blockData.endTime,
    reason: blockData.reason,
    created_by: 'admin',
    created_at: new Date().toISOString()
  };
  list.unshift(newBlock);
  saveStoredBlockedDates(list);
  appendStoredAuditLog('add_blocked_date', newBlock);
  return { success: true, blockedDate: newBlock };
}

export async function adminDeleteBlockedDate(id) {
  let list = getStoredBlockedDates();
  list = list.filter(b => Number(b.id) !== Number(id));
  saveStoredBlockedDates(list);
  appendStoredAuditLog('delete_blocked_date', { id });
  return { success: true };
}

export async function adminGetStaff() {
  return getStoredStaff();
}

export async function adminSaveStaff(staffData, id = null) {
  const staffList = getStoredStaff();
  if (id) {
    const idx = staffList.findIndex(s => Number(s.id) === Number(id));
    if (idx !== -1) {
      staffList[idx] = { ...staffList[idx], ...staffData };
    }
  } else {
    const newStaff = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ...staffData,
      is_active: 1,
      created_at: new Date().toISOString()
    };
    staffList.push(newStaff);
  }
  saveStoredStaff(staffList);
  appendStoredAuditLog('save_staff', { id, name: staffData.name });
  return { success: true };
}

export async function adminDeleteStaff(id) {
  let staffList = getStoredStaff();
  staffList = staffList.filter(s => Number(s.id) !== Number(id));
  saveStoredStaff(staffList);
  appendStoredAuditLog('delete_staff', { id });
  return { success: true };
}

export async function adminGetCustomers(search = '') {
  return getDerivedCustomers(search);
}

export async function adminGetServices() {
  return getStoredServices();
}

export async function adminSaveService(serviceData, id = null) {
  const services = getStoredServices();
  if (id) {
    const idx = services.findIndex(s => Number(s.id) === Number(id));
    if (idx !== -1) {
      services[idx] = { ...services[idx], ...serviceData };
    }
  } else {
    const newSvc = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      slug: serviceData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sort_order: services.length + 1,
      ...serviceData
    };
    services.push(newSvc);
  }
  saveStoredServices(services);
  appendStoredAuditLog('save_service', { id, name: serviceData.name });
  return { success: true };
}

export async function adminGetAddons() {
  return getStoredAddons();
}

export async function adminSaveAddon(addonData, id = null) {
  const addons = getStoredAddons();
  if (id) {
    const idx = addons.findIndex(a => Number(a.id) === Number(id));
    if (idx !== -1) {
      addons[idx] = { ...addons[idx], ...addonData };
    }
  } else {
    const newAddon = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ...addonData
    };
    addons.push(newAddon);
  }
  saveStoredAddons(addons);
  appendStoredAuditLog('save_addon', { id, name: addonData.name });
  return { success: true };
}

export async function adminGetSettings() {
  return getStoredSettings();
}

export async function adminUpdateSettings(settingsList) {
  saveStoredSettings(settingsList);
  appendStoredAuditLog('update_settings', { count: settingsList.length });
  return { success: true };
}

export async function adminGetAuditLogs(limit = 50) {
  return getStoredAuditLogs().slice(0, limit);
}

export async function adminGetReports(startDate = '', endDate = '') {
  return getReportsData(startDate, endDate);
}

export async function resetLocalDemoData() {
  resetAllLocalData();
  return { success: true };
}
