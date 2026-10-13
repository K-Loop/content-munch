import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, CheckCircle2, AlertCircle, ShieldAlert, Calendar } from 'lucide-react';
import { 
  adminGetOperatingHours, adminUpdateOperatingHours, 
  adminGetBlockedDates, adminAddBlockedDate, adminDeleteBlockedDate,
  adminGetSettings, adminUpdateSettings 
} from '../../lib/api';

export default function OperatingHoursTab() {
  const [hours, setHours] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [settingsList, setSettingsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // New Block Form
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [h, b, s] = await Promise.all([
        adminGetOperatingHours(),
        adminGetBlockedDates(),
        adminGetSettings()
      ]);
      setHours(h);
      setBlockedDates(b);
      setSettingsList(s);
    } catch (err) {
      setErrorMsg('Failed to load scheduling settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleHourChange = (index, field, value) => {
    const updated = [...hours];
    updated[index][field] = value;
    setHours(updated);
  };

  const handleSaveHours = async () => {
    setErrorMsg(null);
    try {
      await adminUpdateOperatingHours(hours);
      setSuccessMsg('Operating hours updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update operating hours.');
    }
  };

  const handleSettingChange = (key, value) => {
    const updated = settingsList.map(item => item.key === key ? { ...item, value } : item);
    setSettingsList(updated);
  };

  const handleSaveSettings = async () => {
    setErrorMsg(null);
    try {
      await adminUpdateSettings(settingsList);
      setSuccessMsg('Scheduling rules and buffers updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update settings.');
    }
  };

  const handleAddBlockedSlot = async (e) => {
    e.preventDefault();
    if (!blockStart || !blockEnd || !blockReason) return;
    setErrorMsg(null);

    try {
      const startISO = `${blockStart}:00+05:30`;
      const endISO = `${blockEnd}:00+05:30`;

      await adminAddBlockedDate({
        startTime: startISO,
        endTime: endISO,
        reason: blockReason.trim()
      });
      setBlockReason('');
      setBlockStart('');
      setBlockEnd('');
      setSuccessMsg('Maintenance interval successfully blocked.');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to block slot.');
    }
  };

  const handleDeleteBlockedSlot = async (id) => {
    try {
      await adminDeleteBlockedDate(id);
      loadData();
    } catch (err) {
      setErrorMsg('Failed to remove blocked slot.');
    }
  };

  const getSettingVal = (k) => settingsList.find(s => s.key === k)?.value || '';

  return (
    <div className="space-y-8">
      
      {/* Alert Banner */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Daily Operating Hours Table */}
      <div className="bg-white rounded-3xl border border-studio-border p-6 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-editorial text-xl font-bold text-studio-navy">Daily Operating Hours</h3>
            <p className="text-xs text-studio-muted">Set open & close hours per day of week (Asia/Kolkata IST)</p>
          </div>
          <button
            onClick={handleSaveHours}
            className="px-6 py-2.5 bg-studio-coral hover:bg-studio-coral-hover text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
          >
            Save Operating Hours
          </button>
        </div>

        <div className="divide-y divide-studio-border/60">
          {hours.map((h, idx) => (
            <div key={h.day_of_week} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="w-32 font-bold text-studio-navy flex items-center gap-2">
                <span>{h.day_name}</span>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-studio-charcoal">
                  <input
                    type="checkbox"
                    checked={Boolean(h.is_open)}
                    onChange={(e) => handleHourChange(idx, 'is_open', e.target.checked ? 1 : 0)}
                    className="rounded text-studio-coral focus:ring-studio-coral"
                  />
                  <span>Open for Bookings</span>
                </label>

                {h.is_open ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={h.open_time}
                      placeholder="09:00"
                      onChange={(e) => handleHourChange(idx, 'open_time', e.target.value)}
                      className="w-20 p-2 rounded-lg border border-studio-border bg-studio-cream text-center font-mono font-semibold"
                    />
                    <span className="text-studio-muted">to</span>
                    <input
                      type="text"
                      value={h.close_time}
                      placeholder="21:00"
                      onChange={(e) => handleHourChange(idx, 'close_time', e.target.value)}
                      className="w-20 p-2 rounded-lg border border-studio-border bg-studio-cream text-center font-mono font-semibold"
                    />
                    <span className="text-[11px] text-studio-muted font-mono">IST</span>
                  </div>
                ) : (
                  <span className="text-studio-muted italic">Closed all day</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduling Buffers & Advance Notice Parameters */}
      <div className="bg-white rounded-3xl border border-studio-border p-6 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-editorial text-xl font-bold text-studio-navy">Booking Rules & Buffers</h3>
            <p className="text-xs text-studio-muted">Control buffer times, notice requirements, and advance reservation window</p>
          </div>
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2.5 bg-studio-navy hover:bg-studio-navy-light text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
          >
            Save Scheduling Rules
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1.5 p-4 rounded-2xl bg-studio-cream border border-studio-border/70">
            <label className="font-bold uppercase text-studio-charcoal text-[11px]">Setup Buffer (Minutes)</label>
            <input
              type="number"
              value={getSettingVal('setup_cleanup_buffer_minutes')}
              onChange={(e) => handleSettingChange('setup_cleanup_buffer_minutes', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-studio-border bg-white text-xs font-bold"
            />
            <p className="text-[11px] text-studio-muted">Complimentary gap before/after each reservation (Default: 15m).</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-studio-cream border border-studio-border/70">
            <label className="font-bold uppercase text-studio-charcoal text-[11px]">Min Advance Notice (Hours)</label>
            <input
              type="number"
              value={getSettingVal('min_advance_notice_hours')}
              onChange={(e) => handleSettingChange('min_advance_notice_hours', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-studio-border bg-white text-xs font-bold"
            />
            <p className="text-[11px] text-studio-muted">Prevents last-minute bookings without prep time (Default: 2h).</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-studio-cream border border-studio-border/70">
            <label className="font-bold uppercase text-studio-charcoal text-[11px]">Max Advance Window (Days)</label>
            <input
              type="number"
              value={getSettingVal('max_advance_booking_days')}
              onChange={(e) => handleSettingChange('max_advance_booking_days', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-studio-border bg-white text-xs font-bold"
            />
            <p className="text-[11px] text-studio-muted">Maximum future booking window (Default: 60 days).</p>
          </div>
        </div>
      </div>

      {/* Blocked Dates / Studio Maintenance */}
      <div className="bg-white rounded-3xl border border-studio-border p-6 shadow-soft space-y-6">
        <div>
          <h3 className="font-editorial text-xl font-bold text-studio-navy">Blocked Dates & Studio Maintenance</h3>
          <p className="text-xs text-studio-muted">Prevent online bookings during studio repainting, equipment maintenance, or private events</p>
        </div>

        {/* Add Block Form */}
        <form onSubmit={handleAddBlockedSlot} className="p-4 rounded-2xl bg-studio-cream border border-studio-border grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-studio-charcoal">Start Time</label>
            <input
              type="datetime-local"
              required
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
              className="w-full p-2 rounded-xl border border-studio-border bg-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-studio-charcoal">End Time</label>
            <input
              type="datetime-local"
              required
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
              className="w-full p-2 rounded-xl border border-studio-border bg-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-studio-charcoal">Reason</label>
            <input
              type="text"
              required
              placeholder="e.g. Studio floor repainting"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full p-2 rounded-xl border border-studio-border bg-white text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-studio-navy hover:bg-studio-navy-light text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            + Block Interval
          </button>
        </form>

        {/* Blocked intervals list */}
        {blockedDates.length > 0 ? (
          <div className="divide-y divide-studio-border/60">
            {blockedDates.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-studio-navy">{b.reason}</span>
                  <div className="text-[11px] text-studio-coral font-mono mt-0.5">
                    {b.start_time.slice(0, 16)} to {b.end_time.slice(0, 16)} IST
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBlockedSlot(b.id)}
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove block"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-studio-muted">
            No active blocked maintenance periods.
          </div>
        )}
      </div>

    </div>
  );
}
