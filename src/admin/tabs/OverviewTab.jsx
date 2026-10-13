import React from 'react';
import { Calendar, Clock, DollarSign, CheckCircle2, AlertCircle, XCircle, Users, ArrowUpRight } from 'lucide-react';

export default function OverviewTab({ metrics, onTabChange, onOpenManualBooking }) {
  if (!metrics) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-studio-coral border-t-transparent animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-studio-muted">Loading studio operational metrics...</p>
      </div>
    );
  }

  const { today, counts, recordedRevenue, totalOccupiedHours, recentBookings } = metrics;

  return (
    <div className="space-y-8">
      
      {/* Top Banner & Quick Actions */}
      <div className="bg-white rounded-3xl border border-studio-border p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-soft">
        <div>
          <span className="studio-badge bg-studio-coral-light text-studio-coral mb-2">
            Chennai Studio Operations
          </span>
          <h2 className="editorial-title text-2xl sm:text-3xl font-bold text-studio-navy">
            Today's Studio Summary ({today?.date})
          </h2>
          <p className="text-xs text-studio-muted mt-1">
            {today?.bookingsCount || 0} session(s) scheduled for today • {today?.occupiedHours || 0} occupied hours
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onOpenManualBooking}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-studio-coral hover:bg-studio-coral-hover text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
          >
            + Create Reservation
          </button>
          <button
            onClick={() => onTabChange('calendar')}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-studio-navy hover:bg-studio-navy-light text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
          >
            View Calendar
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Confirmed Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div className="text-2xl font-extrabold text-studio-navy">{counts?.confirmed || 0}</div>
          <div className="text-xs text-studio-muted font-medium mt-0.5">Confirmed Sessions</div>
        </div>

        {/* Occupied Hours */}
        <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">Time</span>
          </div>
          <div className="text-2xl font-extrabold text-studio-navy">{totalOccupiedHours || 0} hrs</div>
          <div className="text-xs text-studio-muted font-medium mt-0.5">Total Booked Hours</div>
        </div>

        {/* Recorded Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full">Collected</span>
          </div>
          <div className="text-2xl font-extrabold text-studio-navy">₹{(recordedRevenue || 0).toLocaleString('en-IN')}</div>
          <div className="text-xs text-studio-muted font-medium mt-0.5">Verified Paid Revenue</div>
        </div>

        {/* Completed Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-2xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-full">History</span>
          </div>
          <div className="text-2xl font-extrabold text-studio-navy">{counts?.completed || 0}</div>
          <div className="text-xs text-studio-muted font-medium mt-0.5">Completed Shoots</div>
        </div>

      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl border border-studio-border p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-editorial text-lg font-bold text-studio-navy">Recent Studio Bookings</h3>
            <p className="text-xs text-studio-muted">Live booking feed stored in the database</p>
          </div>
          <button
            onClick={() => onTabChange('bookings')}
            className="text-xs font-semibold text-studio-coral hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentBookings && recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-studio-border text-studio-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Service</th>
                  <th className="py-3 px-3">Time Interval</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-border/60">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-studio-cream/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-studio-navy">{b.booking_reference}</td>
                    <td className="py-3 px-3 font-semibold text-studio-charcoal">{b.customer_name}</td>
                    <td className="py-3 px-3 text-studio-muted">{b.service_name}</td>
                    <td className="py-3 px-3 font-medium text-studio-coral">
                      {b.start_time.slice(0, 10)} ({b.start_time.slice(11, 16)}–{b.end_time.slice(11, 16)})
                    </td>
                    <td className="py-3 px-3 font-bold text-studio-navy">₹{b.total_price}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.booking_status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.booking_status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : b.booking_status === 'completed'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-studio-muted">
            No booking activity recorded yet.
          </div>
        )}
      </div>

    </div>
  );
}
