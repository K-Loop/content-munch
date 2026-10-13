import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, User, ShieldAlert } from 'lucide-react';
import { adminGetCalendarEvents } from '../../lib/api';

export default function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'day'
  const [events, setEvents] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDayString, setSelectedDayString] = useState('');

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      // Calculate start and end of month
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth();
      const startStr = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const endStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const data = await adminGetCalendarEvents(startStr, endStr);
      setEvents(data.bookings || []);
      setBlockedDates(data.blockedDates || []);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Month grid calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Map events by date YYYY-MM-DD
  const eventsByDate = {};
  for (const b of events) {
    const d = b.start_time.slice(0, 10);
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(b);
  }

  const handleDayClick = (dayNum) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setSelectedDayString(dateStr);
    setSelectedDayEvents(eventsByDate[dateStr] || []);
  };

  return (
    <div className="space-y-6">
      
      {/* Calendar Header */}
      <div className="bg-white rounded-2xl border border-studio-border p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-studio-cream text-studio-coral">
            <CalIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-editorial text-lg font-bold text-studio-navy leading-tight">{monthName}</h3>
            <p className="text-[11px] text-studio-muted">Studio Schedule • Asia/Kolkata (+05:30)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl border border-studio-border hover:bg-studio-cream text-studio-charcoal"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-xl border border-studio-border bg-studio-cream hover:bg-studio-cream-dark text-xs font-semibold text-studio-charcoal"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl border border-studio-border hover:bg-studio-cream text-studio-charcoal"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Month Grid */}
      <div className="bg-white rounded-3xl border border-studio-border shadow-soft p-4 sm:p-6">
        
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-studio-muted">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-24 p-2 rounded-xl bg-studio-cream/20 opacity-40"></div>
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayEvents = eventsByDate[dateStr] || [];
            const isToday = new Date().toISOString().slice(0, 10) === dateStr;
            const isSelected = selectedDayString === dateStr;

            return (
              <div
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                className={`min-h-24 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-studio-coral ring-2 ring-studio-coral/20 bg-white shadow-soft'
                    : isToday
                    ? 'border-studio-navy bg-studio-cream/70'
                    : 'border-studio-border/70 hover:border-studio-coral/40 bg-white hover:bg-studio-cream/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isToday ? 'text-studio-coral font-black' : 'text-studio-navy'}`}>
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-studio-coral"></span>
                  )}
                </div>

                <div className="space-y-1 my-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="text-[10px] truncate px-1.5 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {ev.start_time.slice(11, 16)} {ev.service_name}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-studio-muted font-bold px-1">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-studio-muted text-right">
                  {dayEvents.length > 0 ? `${dayEvents.length} shoot(s)` : ''}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Day Drawer / Details Panel */}
      {selectedDayString && (
        <div className="bg-white rounded-3xl border border-studio-border p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-studio-border pb-3">
            <div>
              <h4 className="font-editorial text-lg font-bold text-studio-navy">
                Sessions on {selectedDayString}
              </h4>
              <p className="text-xs text-studio-muted">
                {selectedDayEvents.length} session(s) reserved on this date
              </p>
            </div>
            <button
              onClick={() => setSelectedDayString('')}
              className="text-xs font-semibold text-studio-coral hover:underline"
            >
              Close
            </button>
          </div>

          {selectedDayEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDayEvents.map((ev) => (
                <div key={ev.id} className="p-4 rounded-2xl bg-studio-cream border border-studio-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-studio-navy">{ev.booking_reference}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {ev.booking_status}
                    </span>
                  </div>
                  <h5 className="font-bold text-sm text-studio-navy">{ev.service_name}</h5>
                  <div className="flex items-center gap-2 text-xs text-studio-coral font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{ev.start_time.slice(11, 16)} – {ev.end_time.slice(11, 16)} IST ({ev.duration_hours}h)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-studio-charcoal">
                    <User className="w-3.5 h-3.5 text-studio-muted" />
                    <span>{ev.customer_name} ({ev.customer_phone})</span>
                  </div>
                  {ev.assigned_staff_name && (
                    <div className="text-[11px] text-studio-muted pt-1 border-t border-studio-border/60">
                      Operator: <strong className="text-studio-navy">{ev.assigned_staff_name}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-studio-muted">
              No sessions booked for {selectedDayString}. The studio floor is currently open for reservations!
            </div>
          )}
        </div>
      )}

    </div>
  );
}
