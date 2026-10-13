// API helper for Content Munch Studio

const API_BASE = '/api';

/**
 * Handle fetch response with error unwrapping
 */
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || data.error || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

/**
 * Get stored admin token
 */
export function getAdminToken() {
  return localStorage.getItem('cm_admin_token') || '';
}

/**
 * Set admin token
 */
export function setAdminToken(token) {
  if (token) {
    localStorage.setItem('cm_admin_token', token);
  } else {
    localStorage.removeItem('cm_admin_token');
  }
}

/**
 * Admin auth headers
 */
function authHeaders() {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// =========================================================================
// PUBLIC API
// =========================================================================

export async function fetchStudioConfig() {
  const res = await fetch(`${API_BASE}/public/config`);
  return handleResponse(res);
}

export async function fetchAvailability(date, duration = 1, serviceId = null) {
  const params = new URLSearchParams({ date, duration: String(duration) });
  if (serviceId) params.append('serviceId', String(serviceId));
  const res = await fetch(`${API_BASE}/availability?${params.toString()}`);
  return handleResponse(res);
}

export async function calculateQuote(serviceId, durationHours, addonIds = []) {
  const res = await fetch(`${API_BASE}/public/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceId, durationHours, addonIds })
  });
  return handleResponse(res);
}

export async function createBooking(payload) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function lookupBooking(reference) {
  const res = await fetch(`${API_BASE}/bookings/lookup/${encodeURIComponent(reference)}`);
  return handleResponse(res);
}

// =========================================================================
// ADMIN API
// =========================================================================

export async function adminLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await handleResponse(res);
  if (data.token) {
    setAdminToken(data.token);
  }
  return data;
}

export async function adminGetMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminGetMetrics() {
  const res = await fetch(`${API_BASE}/admin/metrics`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminGetBookings(filters = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') {
      params.append(k, String(v));
    }
  }
  const res = await fetch(`${API_BASE}/admin/bookings?${params.toString()}`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminUpdateBookingStatus(id, updateData) {
  const res = await fetch(`${API_BASE}/admin/bookings/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(updateData)
  });
  return handleResponse(res);
}

export async function adminRescheduleBooking(id, rescheduleData) {
  const res = await fetch(`${API_BASE}/admin/bookings/${id}/reschedule`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(rescheduleData)
  });
  return handleResponse(res);
}

export async function adminAssignStaff(id, staffId) {
  const res = await fetch(`${API_BASE}/admin/bookings/${id}/assign`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ staffId })
  });
  return handleResponse(res);
}

export async function adminCreateManualBooking(payload) {
  const res = await fetch(`${API_BASE}/admin/bookings/manual`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function adminGetCalendarEvents(start, end) {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  const res = await fetch(`${API_BASE}/admin/calendar-events?${params.toString()}`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminGetOperatingHours() {
  const res = await fetch(`${API_BASE}/admin/operating-hours`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminUpdateOperatingHours(hours) {
  const res = await fetch(`${API_BASE}/admin/operating-hours`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ hours })
  });
  return handleResponse(res);
}

export async function adminGetBlockedDates() {
  const res = await fetch(`${API_BASE}/admin/blocked-dates`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminAddBlockedDate(blockData) {
  const res = await fetch(`${API_BASE}/admin/blocked-dates`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(blockData)
  });
  return handleResponse(res);
}

export async function adminDeleteBlockedDate(id) {
  const res = await fetch(`${API_BASE}/admin/blocked-dates/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminGetStaff() {
  const res = await fetch(`${API_BASE}/admin/staff`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminSaveStaff(staffData, id = null) {
  const url = id ? `${API_BASE}/admin/staff/${id}` : `${API_BASE}/admin/staff`;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: JSON.stringify(staffData)
  });
  return handleResponse(res);
}

export async function adminGetCustomers(search = '') {
  const res = await fetch(`${API_BASE}/admin/customers?search=${encodeURIComponent(search)}`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminGetServices() {
  const res = await fetch(`${API_BASE}/admin/services`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminSaveService(serviceData, id = null) {
  const url = id ? `${API_BASE}/admin/services/${id}` : `${API_BASE}/admin/services`;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: JSON.stringify(serviceData)
  });
  return handleResponse(res);
}

export async function adminGetAddons() {
  const res = await fetch(`${API_BASE}/admin/addons`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminSaveAddon(addonData, id = null) {
  const url = id ? `${API_BASE}/admin/addons/${id}` : `${API_BASE}/admin/addons`;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: JSON.stringify(addonData)
  });
  return handleResponse(res);
}

export async function adminGetSettings() {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminUpdateSettings(settingsList) {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ settings: settingsList })
  });
  return handleResponse(res);
}

export async function adminGetAuditLogs(limit = 50) {
  const res = await fetch(`${API_BASE}/admin/audit-logs?limit=${limit}`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function adminGetReports(startDate = '', endDate = '') {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const res = await fetch(`${API_BASE}/admin/reports?${params.toString()}`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}
