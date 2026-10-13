import React, { useState } from 'react';
import { X, Search, CheckCircle2, AlertCircle, Clock, Calendar, User, Phone } from 'lucide-react';
import { lookupBooking } from '../lib/api';

export default function BookingLookupModal({ isOpen, onClose }) {
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!reference.trim()) return;
    setLoading(true);
    setError(null);
    setBooking(null);

    try {
      const data = await lookupBooking(reference.trim());
      setBooking(data.booking);
    } catch (err) {
      setError(err.message || 'Booking reference not found. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-studio-navy/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FBF9F5] border border-studio-border w-full max-w-lg rounded-3xl shadow-floating overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-white border-b border-studio-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-studio-coral" />
            <h3 className="font-bold text-sm text-studio-navy uppercase tracking-wider">
              Lookup Existing Booking
            </h3>
          </div>
          <button onClick={onClose} className="text-studio-muted hover:text-studio-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-bold text-studio-charcoal uppercase tracking-wider">
              Enter Booking Reference (e.g. CM-20261014-XXXX)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="CM-YYYYMMDD-XXXX"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                className="flex-1 p-3 rounded-xl border border-studio-border bg-white text-sm font-mono uppercase focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-studio-coral hover:bg-studio-coral-hover text-white px-5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {loading ? 'Finding...' : 'Search'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {booking && (
            <div className="bg-white rounded-2xl border border-studio-border p-5 space-y-4 shadow-soft">
              <div className="flex items-center justify-between pb-3 border-b border-studio-border/60">
                <div>
                  <span className="text-[10px] font-bold uppercase text-studio-muted tracking-wider">Reference</span>
                  <div className="font-mono font-bold text-sm text-studio-navy">{booking.booking_reference}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  booking.booking_status === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : booking.booking_status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {booking.booking_status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-studio-muted block text-[11px]">Service</span>
                  <span className="font-bold text-studio-navy">{booking.service_name}</span>
                </div>
                <div>
                  <span className="text-studio-muted block text-[11px]">Duration</span>
                  <span className="font-bold text-studio-navy">{booking.duration_hours} Hour(s)</span>
                </div>
                <div>
                  <span className="text-studio-muted block text-[11px]">Date</span>
                  <span className="font-bold text-studio-navy">{booking.start_time.slice(0, 10)}</span>
                </div>
                <div>
                  <span className="text-studio-muted block text-[11px]">Time Interval</span>
                  <span className="font-bold text-studio-coral">
                    {booking.start_time.slice(11, 16)} – {booking.end_time.slice(11, 16)} IST
                  </span>
                </div>
                <div>
                  <span className="text-studio-muted block text-[11px]">Customer</span>
                  <span className="font-semibold text-studio-charcoal">{booking.customer_name}</span>
                </div>
                <div>
                  <span className="text-studio-muted block text-[11px]">Total Fee</span>
                  <span className="font-bold text-studio-navy">₹{booking.total_price}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-studio-border/60 text-[11px] text-studio-muted">
                Need to reschedule? Call our studio director at <a href="tel:+919489680339" className="text-studio-coral font-bold">+91 94896 80339</a>.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
