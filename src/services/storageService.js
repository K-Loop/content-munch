// Reusable browser localStorage service with error handling, validation, and safe defaults

import { 
  DEFAULT_RESOURCES, 
  DEFAULT_SETTINGS, 
  DEFAULT_OPERATING_HOURS, 
  DEFAULT_SERVICES, 
  DEFAULT_ADDONS 
} from './defaultData.js';

const STORAGE_KEYS = {
  BOOKINGS: 'cm_local_bookings',
  BLOCKED_DATES: 'cm_local_blocked_dates',
  STAFF: 'cm_local_staff',
  SETTINGS: 'cm_local_settings',
  OPERATING_HOURS: 'cm_local_operating_hours',
  SERVICES: 'cm_local_services',
  ADDONS: 'cm_local_addons',
  AUDIT_LOGS: 'cm_local_audit_logs',
  ADMIN_SESSION: 'cm_admin_session'
};

// In-memory fallback if localStorage is disabled or throws quota errors
const memoryFallback = new Map();

function safeGetItem(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryFallback.get(key) || null;
  } catch (err) {
    console.warn(`LocalStorage read error for "${key}", using memory fallback:`, err);
    return memoryFallback.get(key) || null;
  }
}

function safeSetItem(key, value) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    memoryFallback.set(key, value);
  } catch (err) {
    console.warn(`LocalStorage write error for "${key}", saving to memory fallback:`, err);
    memoryFallback.set(key, value);
  }
}

function safeRemoveItem(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    memoryFallback.delete(key);
  } catch (err) {
    console.warn(`LocalStorage remove error for "${key}":`, err);
    memoryFallback.delete(key);
  }
}

function parseJSON(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    console.warn('Malformed JSON in storage, reverting to fallback:', e);
    return fallback;
  }
}

// =========================================================================
// DATA ACCESSORS
// =========================================================================

/**
 * Bookings: STRICT REQUIREMENT: Initial state must be empty array []
 */
export function getStoredBookings() {
  const raw = safeGetItem(STORAGE_KEYS.BOOKINGS);
  const data = parseJSON(raw, []);
  return Array.isArray(data) ? data : [];
}

export function saveStoredBookings(bookings) {
  safeSetItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings || []));
}

/**
 * Blocked Dates: STRICT REQUIREMENT: Initial state must be empty array []
 */
export function getStoredBlockedDates() {
  const raw = safeGetItem(STORAGE_KEYS.BLOCKED_DATES);
  const data = parseJSON(raw, []);
  return Array.isArray(data) ? data : [];
}

export function saveStoredBlockedDates(blocked) {
  safeSetItem(STORAGE_KEYS.BLOCKED_DATES, JSON.stringify(blocked || []));
}

/**
 * Staff: STRICT REQUIREMENT: Initial state must be empty array []
 */
export function getStoredStaff() {
  const raw = safeGetItem(STORAGE_KEYS.STAFF);
  const data = parseJSON(raw, []);
  return Array.isArray(data) ? data : [];
}

export function saveStoredStaff(staff) {
  safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(staff || []));
}

/**
 * Studio Operating Settings
 */
export function getStoredSettings() {
  const raw = safeGetItem(STORAGE_KEYS.SETTINGS);
  const data = parseJSON(raw, null);
  if (Array.isArray(data) && data.length > 0) return data;
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings) {
  safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings || DEFAULT_SETTINGS));
}

/**
 * Operating Hours
 */
export function getStoredOperatingHours() {
  const raw = safeGetItem(STORAGE_KEYS.OPERATING_HOURS);
  const data = parseJSON(raw, null);
  if (Array.isArray(data) && data.length > 0) return data;
  return DEFAULT_OPERATING_HOURS;
}

export function saveStoredOperatingHours(hours) {
  safeSetItem(STORAGE_KEYS.OPERATING_HOURS, JSON.stringify(hours || DEFAULT_OPERATING_HOURS));
}

/**
 * Services Configuration
 */
export function getStoredServices() {
  const raw = safeGetItem(STORAGE_KEYS.SERVICES);
  const data = parseJSON(raw, null);
  if (Array.isArray(data) && data.length > 0) return data;
  return DEFAULT_SERVICES;
}

export function saveStoredServices(services) {
  safeSetItem(STORAGE_KEYS.SERVICES, JSON.stringify(services || DEFAULT_SERVICES));
}

/**
 * Add-ons Configuration
 */
export function getStoredAddons() {
  const raw = safeGetItem(STORAGE_KEYS.ADDONS);
  const data = parseJSON(raw, null);
  if (Array.isArray(data) && data.length > 0) return data;
  return DEFAULT_ADDONS;
}

export function saveStoredAddons(addons) {
  safeSetItem(STORAGE_KEYS.ADDONS, JSON.stringify(addons || DEFAULT_ADDONS));
}

/**
 * Audit Logs: Initially empty []
 */
export function getStoredAuditLogs() {
  const raw = safeGetItem(STORAGE_KEYS.AUDIT_LOGS);
  const data = parseJSON(raw, []);
  return Array.isArray(data) ? data : [];
}

export function appendStoredAuditLog(action, details = {}) {
  const logs = getStoredAuditLogs();
  const entry = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    actor_name: 'Studio Director',
    action,
    details: typeof details === 'string' ? details : JSON.stringify(details),
    created_at: new Date().toISOString()
  };
  logs.unshift(entry);
  safeSetItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
  return entry;
}

/**
 * Demo Admin Session State (No passwords stored)
 */
export function getStoredAdminSession() {
  const raw = safeGetItem(STORAGE_KEYS.ADMIN_SESSION);
  return parseJSON(raw, null);
}

export function saveStoredAdminSession(user) {
  if (user) {
    safeSetItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(user));
  } else {
    safeRemoveItem(STORAGE_KEYS.ADMIN_SESSION);
  }
}

/**
 * Reset all local storage to clean, empty initial state
 * Wipes all test bookings, customers, staff, blocked dates, and restores clean defaults.
 */
export function resetAllLocalData() {
  safeSetItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
  safeSetItem(STORAGE_KEYS.BLOCKED_DATES, JSON.stringify([]));
  safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify([]));
  safeSetItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
  safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  safeSetItem(STORAGE_KEYS.OPERATING_HOURS, JSON.stringify(DEFAULT_OPERATING_HOURS));
  safeSetItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
  safeSetItem(STORAGE_KEYS.ADDONS, JSON.stringify(DEFAULT_ADDONS));
  safeRemoveItem(STORAGE_KEYS.ADMIN_SESSION);
  return true;
}

export { STORAGE_KEYS };
