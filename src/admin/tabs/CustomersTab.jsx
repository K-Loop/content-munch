import React, { useState, useEffect } from 'react';
import { Search, User, Phone, Mail, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { adminGetCustomers } from '../../lib/api';

export default function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await adminGetCustomers(search);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header */}
      <div className="bg-white rounded-2xl border border-studio-border p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-editorial text-lg font-bold text-studio-navy">Creator & Client Directory</h3>
          <p className="text-xs text-studio-muted">Customer profiles and past session activity</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-studio-muted absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-studio-border bg-studio-cream text-xs text-studio-charcoal focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-studio-border shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-studio-coral border-t-transparent animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-studio-muted">Loading customer records...</p>
          </div>
        ) : customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-studio-cream/50 text-studio-muted uppercase tracking-wider text-[10px] border-b border-studio-border">
                <tr>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Total Bookings</th>
                  <th className="py-3.5 px-4">Completed</th>
                  <th className="py-3.5 px-4">Cancelled</th>
                  <th className="py-3.5 px-4">Latest Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-border/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-studio-cream/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-studio-navy">
                      {c.name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-studio-charcoal">
                      {c.phone}
                    </td>
                    <td className="py-3.5 px-4 text-studio-muted">
                      {c.email}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-studio-navy">
                      {c.total_bookings}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">
                      {c.completed_sessions}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-red-600">
                      {c.cancelled_sessions}
                    </td>
                    <td className="py-3.5 px-4 text-studio-coral font-medium">
                      {c.last_booking_time ? c.last_booking_time.slice(0, 10) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-studio-muted">
            No customer records found.
          </div>
        )}
      </div>

    </div>
  );
}
