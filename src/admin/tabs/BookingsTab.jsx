import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Plus, Clock, User, Phone, CheckCircle, 
  XCircle, AlertCircle, RefreshCw, Calendar, Edit, ChevronLeft, ChevronRight, UserCheck
} from 'lucide-react';
import { 
  adminGetBookings, adminUpdateBookingStatus, adminRescheduleBooking, 
  adminAssignStaff, adminCreateManualBooking, adminGetStaff, adminGetServices 
} from '../../lib/api';

export default function BookingsTab({ initialOpenManual = false }) {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');

  // Supporting Data
  const [staffList, setStaffList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  // Modals
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(initialOpenManual);

  // Modal form states
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Manual booking form state
  const [manualServiceId, setManualServiceId] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('10:00');
  const [manualDuration, setManualDuration] = useState(1);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('+91 ');
  const [manualNotes, setManualNotes] = useState('');

  useEffect(() => {
    loadSupportingData();
  }, []);

  useEffect(() => {
    loadBookings(1);
  }, [search, statusFilter, staffFilter]);

  const loadSupportingData = async () => {
    try {
      const [staffData, servicesData] = await Promise.all([adminGetStaff(), adminGetServices()]);
      setStaffList(staffData);
      setServicesList(servicesData);
      if (servicesData.length > 0) setManualServiceId(servicesData[0].id);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setManualDate(tomorrow.toISOString().slice(0, 10));
    } catch (err) {
      console.error('Failed to load supporting data:', err);
    }
  };

  const loadBookings = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminGetBookings({
        search,
        status: statusFilter,
        staffId: staffFilter,
        page,
        limit: 15
      });
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminUpdateBookingStatus(id, { status: newStatus });
      setActionSuccess(`Booking updated to ${newStatus}`);
      setTimeout(() => setActionSuccess(null), 3000);
      loadBookings(pagination.page);
    } catch (err) {
      setActionError(err.message || 'Failed to update status');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking || !newDate || !newStartTime) return;
    setActionError(null);

    try {
      await adminRescheduleBooking(selectedBooking.id, {
        date: newDate,
        startTime: newStartTime,
        durationHours: selectedBooking.duration_hours
      });
      setRescheduleModalOpen(false);
      setActionSuccess('Booking successfully rescheduled.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadBookings(pagination.page);
    } catch (err) {
      setActionError(err.message || 'Rescheduling failed.');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setActionError(null);

    try {
      await adminAssignStaff(selectedBooking.id, selectedStaffId ? Number(selectedStaffId) : null);
      setAssignModalOpen(false);
      setActionSuccess('Staff operator assigned successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadBookings(pagination.page);
    } catch (err) {
      setActionError(err.message || 'Assignment failed.');
    }
  };

  const handleManualBookingSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);

    try {
      await adminCreateManualBooking({
        serviceId: Number(manualServiceId),
        date: manualDate,
        startTime: manualTime,
        durationHours: Number(manualDuration),
        customerName: manualName.trim(),
        customerEmail: manualEmail.trim(),
        customerPhone: manualPhone.trim(),
        internalNotes: manualNotes.trim()
      });
      setManualModalOpen(false);
      setActionSuccess('Manual reservation created successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadBookings(1);
    } catch (err) {
      setActionError(err.message || 'Failed to create manual reservation');
    }
  };

  const handleExportCsv = () => {
    window.open('/api/admin/bookings/export-csv', '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Alert Banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white rounded-2xl border border-studio-border p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-studio-muted absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search reference, customer name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-studio-border bg-studio-cream text-xs text-studio-charcoal focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-xl border border-studio-border bg-white text-xs font-semibold text-studio-charcoal focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No-Show</option>
          </select>

          {/* Staff filter */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="p-2 rounded-xl border border-studio-border bg-white text-xs font-semibold text-studio-charcoal focus:outline-hidden"
          >
            <option value="all">All Staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-studio-border bg-white hover:bg-studio-cream text-studio-charcoal text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Create Manual Reservation */}
          <button
            onClick={() => setManualModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-studio-coral hover:bg-studio-coral-hover text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Booking</span>
          </button>
        </div>

      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-studio-border shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-studio-coral border-t-transparent animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-studio-muted">Loading bookings...</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-studio-cream/50 text-studio-muted uppercase tracking-wider text-[10px] border-b border-studio-border">
                <tr>
                  <th className="py-3.5 px-4">Ref Code</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Date & Interval (IST)</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Staff</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-border/60">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-studio-cream/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-studio-navy">
                      {b.booking_reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-studio-charcoal">{b.customer_name}</div>
                      <div className="text-[11px] text-studio-muted">{b.customer_phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-studio-charcoal">
                      {b.service_name}
                      <span className="block text-[11px] text-studio-muted">{b.duration_hours} hr(s)</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-studio-navy">{b.start_time.slice(0, 10)}</div>
                      <div className="text-studio-coral font-medium text-[11px]">
                        {b.start_time.slice(11, 16)} – {b.end_time.slice(11, 16)} IST
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-studio-navy">₹{b.total_price}</div>
                      <span className="text-[10px] text-studio-muted capitalize">{b.payment_status}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={b.booking_status}
                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        className={`text-[10px] font-bold uppercase rounded-lg px-2 py-1 border border-transparent focus:border-studio-border focus:outline-hidden ${
                          b.booking_status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.booking_status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : b.booking_status === 'completed'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no-show">No-Show</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => {
                          setSelectedBooking(b);
                          setSelectedStaffId(b.assigned_staff_id || '');
                          setAssignModalOpen(true);
                        }}
                        className="text-left group flex items-center gap-1.5"
                      >
                        <span className={`text-xs ${b.staff_name ? 'font-semibold text-studio-navy' : 'text-studio-muted italic'}`}>
                          {b.staff_name || 'Assign Staff'}
                        </span>
                        <Edit className="w-3 h-3 text-studio-muted group-hover:text-studio-coral transition-colors" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setNewDate(b.start_time.slice(0, 10));
                            setNewStartTime(b.start_time.slice(11, 16));
                            setRescheduleModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-studio-cream hover:bg-studio-coral hover:text-white text-studio-charcoal text-[11px] font-semibold border border-studio-border transition-colors"
                        >
                          Reschedule
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-studio-muted">
            No bookings found matching current search criteria.
          </div>
        )}

        {/* Pagination Footer */}
        <div className="bg-studio-cream/30 border-t border-studio-border px-6 py-3.5 flex items-center justify-between text-xs text-studio-muted">
          <span>Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total bookings)</span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => loadBookings(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-studio-border bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadBookings(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-studio-border bg-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* RESCHEDULE MODAL (CONCURRENCY-SAFE) */}
      {/* ========================================================================= */}
      {rescheduleModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-studio-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-studio-border rounded-3xl p-6 w-full max-w-md space-y-4 shadow-floating">
            <h4 className="font-editorial text-lg font-bold text-studio-navy">
              Reschedule {selectedBooking.booking_reference}
            </h4>
            <p className="text-xs text-studio-muted">
              Current slot: {selectedBooking.start_time.slice(0, 10)} ({selectedBooking.start_time.slice(11, 16)}–{selectedBooking.end_time.slice(11, 16)} IST). Overlaps will be rejected automatically.
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-studio-charcoal">New Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-studio-charcoal">New Start Time (HH:MM)</label>
                <input
                  type="text"
                  required
                  placeholder="10:00"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-studio-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-studio-coral text-white text-xs font-semibold uppercase tracking-wider"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ASSIGN STAFF MODAL */}
      {/* ========================================================================= */}
      {assignModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-studio-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-studio-border rounded-3xl p-6 w-full max-w-md space-y-4 shadow-floating">
            <h4 className="font-editorial text-lg font-bold text-studio-navy">
              Assign Staff for {selectedBooking.booking_reference}
            </h4>
            <p className="text-xs text-studio-muted">
              Select an operator or studio manager. Overlaps with the staff member's other duties will be blocked.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full p-3 rounded-xl border border-studio-border bg-studio-cream text-xs font-semibold"
              >
                <option value="">Unassigned</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-studio-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-studio-navy text-white text-xs font-semibold uppercase tracking-wider"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANUAL ADMIN RESERVATION MODAL */}
      {/* ========================================================================= */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-studio-navy/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-studio-border rounded-3xl p-6 sm:p-8 w-full max-w-xl space-y-4 shadow-floating my-8">
            <h4 className="font-editorial text-xl font-bold text-studio-navy">
              Create Manual Reservation
            </h4>
            <p className="text-xs text-studio-muted">
              Passes identical conflict checks as online bookings. Used for phone reservations or VIP bookings.
            </p>

            <form onSubmit={handleManualBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-studio-charcoal">Service</label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-studio-border bg-studio-cream text-xs"
                  >
                    {servicesList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} (₹{s.base_hourly_rate}/h)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-studio-charcoal">Duration (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-studio-border bg-studio-cream text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-studio-charcoal">Date</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-studio-border bg-studio-cream text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-studio-charcoal">Start Time (HH:MM)</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-studio-border bg-studio-cream text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-studio-charcoal">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Client name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-studio-border bg-studio-cream text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-studio-charcoal">Customer Email</label>
                  <input
                    type="email"
                    required
                    placeholder="client@gmail.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-studio-border bg-studio-cream text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-studio-charcoal">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 94896 80339"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-studio-border bg-studio-cream text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-studio-charcoal">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-studio-border bg-studio-cream text-xs"
                    placeholder="Optional shoot specifications..."
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-studio-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-studio-coral text-white text-xs font-semibold uppercase tracking-wider"
                >
                  Save Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
