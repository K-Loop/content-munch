import React, { useState, useEffect } from 'react';
import { BarChart3, ShieldCheck, Download, Calendar, DollarSign, Clock, Users } from 'lucide-react';
import { adminGetReports, adminGetAuditLogs } from '../../lib/api';

export default function ReportsTab() {
  const [reportsData, setReportsData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, logs] = await Promise.all([
        adminGetReports(startDate, endDate),
        adminGetAuditLogs(50)
      ]);
      setReportsData(r);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load reports and audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = reportsData?.summary || {};
  const serviceBreakdown = reportsData?.serviceBreakdown || [];

  return (
    <div className="space-y-8">
      
      {/* Date Filter Bar */}
      <div className="bg-white rounded-2xl border border-studio-border p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-editorial text-lg font-bold text-studio-navy">Studio Reports & Utilization</h3>
          <p className="text-xs text-studio-muted">Actual booking values and equipment usage metrics</p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-studio-muted font-bold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1.5 rounded-lg border border-studio-border bg-studio-cream"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-studio-muted font-bold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1.5 rounded-lg border border-studio-border bg-studio-cream"
            />
          </div>
        </div>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-studio-muted block mb-1">Total Reservations</span>
          <div className="text-2xl font-extrabold text-studio-navy">{summary.total_reservations || 0}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {summary.confirmed_count || 0} active • {summary.completed_count || 0} completed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-studio-muted block mb-1">Gross Booking Value</span>
          <div className="text-2xl font-extrabold text-studio-navy">₹{(summary.gross_booking_value || 0).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-studio-muted mt-1">Total scheduled value</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-studio-muted block mb-1">Total Booked Hours</span>
          <div className="text-2xl font-extrabold text-studio-navy">{summary.total_duration_hours || 0} hrs</div>
          <div className="text-[11px] text-studio-muted mt-1">Floor production time</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-studio-muted block mb-1">Cancellations</span>
          <div className="text-2xl font-extrabold text-red-600">{summary.cancelled_count || 0}</div>
          <div className="text-[11px] text-studio-muted mt-1">Released back to availability</div>
        </div>
      </div>

      {/* Breakdown by Service */}
      <div className="bg-white rounded-3xl border border-studio-border p-6 shadow-soft space-y-4">
        <h4 className="font-editorial text-lg font-bold text-studio-navy">Utilization by Service Category</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-studio-cream/50 text-studio-muted uppercase tracking-wider text-[10px] border-b border-studio-border">
              <tr>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Bookings Count</th>
                <th className="py-3 px-4">Total Hours</th>
                <th className="py-3 px-4">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-border/60">
              {serviceBreakdown.map((s, idx) => (
                <tr key={idx} className="hover:bg-studio-cream/40">
                  <td className="py-3 px-4 font-bold text-studio-navy">{s.service_name}</td>
                  <td className="py-3 px-4 font-semibold text-studio-charcoal">{s.bookings_count}</td>
                  <td className="py-3 px-4 text-studio-muted">{s.hours} hrs</td>
                  <td className="py-3 px-4 font-bold text-studio-coral">₹{(s.total_value || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Trail */}
      <div className="bg-white rounded-3xl border border-studio-border p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-editorial text-lg font-bold text-studio-navy">Security & Administrative Audit Trail</h4>
            <p className="text-xs text-studio-muted">Immutable log of system modifications and staff logins</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-studio-cream rounded-full border border-studio-border text-studio-charcoal">
            Last 50 Events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-studio-cream/50 text-studio-muted uppercase tracking-wider text-[10px] border-b border-studio-border">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC/ISO)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-border/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-studio-cream/40">
                  <td className="py-3 px-4 font-mono text-[11px] text-studio-muted">{log.created_at.slice(0, 19).replace('T', ' ')}</td>
                  <td className="py-3 px-4 font-bold text-studio-navy">{log.actor_name}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-studio-coral">{log.action}</td>
                  <td className="py-3 px-4 text-studio-charcoal">{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                  <td className="py-3 px-4 text-studio-muted font-mono text-[11px] truncate max-w-xs">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
