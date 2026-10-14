import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Check, ArrowRight, ArrowLeft, 
  AlertCircle, ShieldCheck, Camera, Sparkles, X, Copy, ExternalLink, CheckCircle2
} from 'lucide-react';
import { fetchAvailability, calculateQuote, createBooking } from '../lib/api';

export default function BookingEngine({ 
  services = [], 
  addons = [], 
  settings = {}, 
  initialService = null,
  isOpen = false, 
  onClose 
}) {
  // Step State (1 to 8)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(null); // { startTime, endTime, startISO, endISO }
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  
  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+91 ');
  const [customerNotes, setCustomerNotes] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Async & UI State
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [dayAvailability, setDayAvailability] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Set default initial service or date
  useEffect(() => {
    if (initialService) {
      setSelectedServiceId(initialService.id);
      setSelectedDuration(initialService.min_duration_hours || 1);
    } else if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
      setSelectedDuration(services[0].min_duration_hours || 1);
    }

    // Set default date to tomorrow in YYYY-MM-DD
    if (!selectedDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [initialService, services]);

  // When selected service changes, adjust duration if below min
  useEffect(() => {
    if (selectedServiceId) {
      const s = services.find(item => item.id === selectedServiceId);
      if (s && selectedDuration < s.min_duration_hours) {
        setSelectedDuration(s.min_duration_hours);
      }
    }
  }, [selectedServiceId, services]);

  // Fetch slots whenever date or duration changes
  useEffect(() => {
    if (selectedDate && selectedDuration && selectedServiceId) {
      loadSlots(selectedDate, selectedDuration, selectedServiceId);
    }
  }, [selectedDate, selectedDuration, selectedServiceId]);

  // Recalculate quote whenever service, duration, or addons change
  useEffect(() => {
    if (selectedServiceId && selectedDuration) {
      loadQuote(selectedServiceId, selectedDuration, selectedAddonIds);
    }
  }, [selectedServiceId, selectedDuration, selectedAddonIds]);

  const loadSlots = async (date, duration, serviceId) => {
    setLoadingSlots(true);
    setErrorMsg(null);
    try {
      const data = await fetchAvailability(date, duration, serviceId);
      setDayAvailability(data);
      // Reset selected slot if no longer in available list
      if (selectedSlot) {
        const stillValid = data.slots.some(s => s.startTime === selectedSlot.startTime && s.isAvailable);
        if (!stillValid) setSelectedSlot(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch studio schedule');
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadQuote = async (serviceId, duration, addonIds) => {
    setLoadingQuote(true);
    try {
      const data = await calculateQuote(serviceId, duration, addonIds);
      setQuote(data);
    } catch (err) {
      console.error('Failed to load quote:', err);
    } finally {
      setLoadingQuote(false);
    }
  };

  const toggleAddon = (addonId) => {
    if (selectedAddonIds.includes(addonId)) {
      setSelectedAddonIds(selectedAddonIds.filter(id => id !== addonId));
    } else {
      setSelectedAddonIds([...selectedAddonIds, addonId]);
    }
  };

  // Submit booking
  const handleConfirmBooking = async () => {
    if (!acceptTerms) {
      setErrorMsg('Please accept the studio cancellation terms to proceed.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        serviceId: selectedServiceId,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        durationHours: selectedDuration,
        addonIds: selectedAddonIds,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        customerNotes: customerNotes.trim(),
        acceptTerms: true
      };

      const response = await createBooking(payload);
      setConfirmedBooking(response.booking);
      setCurrentStep(8); // Confirmation step
    } catch (err) {
      if (err.status === 409) {
        setErrorMsg('Conflict: This time slot was just booked by another creator. Please select an alternative time.');
        setCurrentStep(3); // Go back to slot selection
        if (selectedDate && selectedDuration && selectedServiceId) {
          loadSlots(selectedDate, selectedDuration, selectedServiceId);
        }
      } else {
        setErrorMsg(err.message || 'Failed to complete reservation. Please verify your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyRefToClipboard = () => {
    if (confirmedBooking?.bookingReference) {
      navigator.clipboard.writeText(confirmedBooking.bookingReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  const activeService = services.find(s => s.id === selectedServiceId) || services[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-studio-navy/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative bg-[#FBF9F5] border border-studio-border w-full max-w-4xl rounded-3xl shadow-floating overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-white border-b border-studio-border px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-studio-navy text-white flex items-center justify-center font-bold text-xs">
              CM
            </div>
            <div>
              <h3 className="font-editorial text-lg font-bold text-studio-navy leading-tight">
                Reserve Content Munch Studio
              </h3>
              <p className="text-[11px] text-studio-muted">
                Step {Math.min(currentStep, 7)} of 7 • Chennai Timezone (Asia/Kolkata) • Browser Local Simulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-studio-muted hover:text-studio-charcoal hover:bg-studio-cream transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-studio-border/50 h-1">
          <div 
            className="bg-studio-coral h-1 transition-all duration-300"
            style={{ width: `${(Math.min(currentStep, 7) / 7) * 100}%` }}
          ></div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="m-4 mb-0 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Area */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* ========================================================================= */}
          {/* STEP 1: SELECT SERVICE */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold font-editorial text-studio-navy mb-1">
                  1. Choose Your Session Type
                </h4>
                <p className="text-xs text-studio-muted">
                  Select the creative format you are producing at Content Munch Studio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {services.map((service) => {
                  const isSelected = selectedServiceId === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => {
                        setSelectedServiceId(service.id);
                        if (selectedDuration < service.min_duration_hours) {
                          setSelectedDuration(service.min_duration_hours);
                        }
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-studio-coral bg-white ring-2 ring-studio-coral/20 shadow-soft'
                          : 'border-studio-border bg-white/70 hover:bg-white hover:border-studio-coral/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="font-bold text-sm text-studio-navy leading-snug">{service.name}</h5>
                        <span className="text-xs font-extrabold text-studio-coral shrink-0">
                          ₹{service.base_hourly_rate}/hr
                        </span>
                      </div>
                      <p className="text-xs text-studio-muted line-clamp-2 mb-3">{service.description}</p>
                      <div className="flex items-center gap-2 text-[11px] text-studio-charcoal/80 font-medium">
                        <Clock className="w-3 h-3 text-studio-coral" />
                        <span>Min. {service.min_duration_hours} hour session</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: SELECT DATE & DURATION */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold font-editorial text-studio-navy mb-1">
                  2. Select Date & Duration
                </h4>
                <p className="text-xs text-studio-muted">
                  Studio operating hours: Mon-Sat 09:00 - 21:00, Sun 10:00 - 19:00 IST.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Date Picker */}
                <div className="bg-white p-5 rounded-2xl border border-studio-border space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                    Session Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-studio-border bg-studio-cream text-studio-charcoal text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-studio-coral"
                  />
                  {dayAvailability && (
                    <div className="pt-2 text-xs">
                      {dayAvailability.isOpen ? (
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Open ({dayAvailability.openTime} – {dayAvailability.closeTime} IST)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Studio Closed on {dayAvailability.dayName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Duration Picker */}
                <div className="bg-white p-5 rounded-2xl border border-studio-border space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                    Duration (Hours)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 8].map((hours) => {
                      const minHours = activeService?.min_duration_hours || 1;
                      const isTooShort = hours < minHours;
                      return (
                        <button
                          key={hours}
                          type="button"
                          disabled={isTooShort}
                          onClick={() => setSelectedDuration(hours)}
                          className={`py-3 rounded-xl text-xs font-bold transition-all ${
                            selectedDuration === hours
                              ? 'bg-studio-navy text-white shadow-2xs'
                              : isTooShort
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-studio-cream hover:bg-studio-cream-dark text-studio-charcoal border border-studio-border'
                          }`}
                        >
                          {hours} hr{hours > 1 ? 's' : ''}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-studio-muted">
                    Min duration for {activeService?.name || 'this service'}: {activeService?.min_duration_hours || 1} hr.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SELECT START TIME SLOT */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold font-editorial text-studio-navy mb-1">
                  3. Select Your Start Time Slot
                </h4>
                <p className="text-xs text-studio-muted">
                  Real-time slots for {selectedDate} ({selectedDuration} hour session). Includes 15-minute preparation buffer.
                </p>
              </div>

              {loadingSlots ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-studio-coral border-t-transparent animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-studio-muted">Checking studio availability in Chennai...</p>
                </div>
              ) : dayAvailability && dayAvailability.slots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {dayAvailability.slots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3.5 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-studio-navy text-white border-studio-navy ring-2 ring-studio-navy/20 shadow-xs'
                            : slot.isAvailable
                            ? 'bg-white hover:border-studio-coral text-studio-charcoal border-studio-border'
                            : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="font-extrabold text-sm leading-tight">
                          {slot.startTime}
                        </div>
                        <div className={`text-[11px] mt-1 ${isSelected ? 'text-white/80' : 'text-studio-muted'}`}>
                          Until {slot.endTime}
                        </div>
                        {!slot.isAvailable && (
                          <div className="text-[10px] text-red-500 font-semibold mt-1">
                            {slot.unavailabilityReason || 'Booked'}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center bg-white rounded-2xl border border-studio-border p-6">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h5 className="font-bold text-sm text-studio-navy">No Slots Available for this Selection</h5>
                  <p className="text-xs text-studio-muted mt-1 max-w-md mx-auto">
                    The studio might be closed, fully booked, or the requested duration exceeds operating hours. Try another date or duration.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: ADD-ONS (OPTIONAL EQUIPMENT & PRODUCTION ASSISTANCE) */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold font-editorial text-studio-navy mb-1">
                  4. Add Optional Production Assistance
                </h4>
                <p className="text-xs text-studio-muted">
                  Elevate your shoot with professional gear operators, audio kits, or teleprompter support.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addons.map((addon) => {
                  const isChecked = selectedAddonIds.includes(addon.id);
                  const priceLabel = addon.price_type === 'per_hour'
                    ? `₹${addon.price}/hr (₹${Math.round(addon.price * selectedDuration)} for ${selectedDuration}h)`
                    : `₹${addon.price} flat fee`;

                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                        isChecked
                          ? 'border-studio-coral bg-white ring-2 ring-studio-coral/20 shadow-soft'
                          : 'border-studio-border bg-white/70 hover:bg-white hover:border-studio-coral/30'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked ? 'bg-studio-coral border-studio-coral text-white' : 'border-studio-border bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h5 className="font-bold text-sm text-studio-navy leading-snug">{addon.name}</h5>
                          <span className="text-xs font-bold text-studio-coral shrink-0">{priceLabel}</span>
                        </div>
                        <p className="text-xs text-studio-muted leading-relaxed">{addon.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {quote && (
                <div className="p-4 rounded-2xl bg-white border border-studio-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-studio-charcoal">Current Running Total:</span>
                  <span className="text-lg font-bold text-studio-navy">₹{quote.totalPrice} <span className="text-xs font-normal text-studio-muted">(incl. GST)</span></span>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: CUSTOMER CONTACT DETAILS */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold font-editorial text-studio-navy mb-1">
                  5. Creator Contact Information
                </h4>
                <p className="text-xs text-studio-muted">
                  We'll send your booking confirmation and entry instructions to these details.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sundaram"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-studio-border bg-white text-sm focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="creator@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-studio-border bg-white text-sm focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98401 23456"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-3 rounded-xl border border-studio-border bg-white text-sm focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                    Shoot Notes & Equipment Requirements (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what you plan to shoot (e.g. 2-person podcast with laptop, product unboxing on white backdrop)..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-studio-border bg-white text-sm focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 6 & 7: REVIEW SUMMARY & CONFIRMATION */}
          {/* ========================================================================= */}
          {currentStep === 6 && quote && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold font-editorial text-studio-navy mb-1">
                  6. Review & Confirm Reservation
                </h4>
                <p className="text-xs text-studio-muted">
                  Please verify your session timing, selected upgrades, and breakdown before finalizing.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-studio-border p-6 space-y-6">
                
                {/* Session Summary Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-studio-border/60">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-studio-muted font-bold block mb-1">Service</span>
                    <span className="text-sm font-bold text-studio-navy">{activeService?.name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-studio-muted font-bold block mb-1">Date</span>
                    <span className="text-sm font-bold text-studio-navy">{selectedDate}</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-studio-muted font-bold block mb-1">Time Slot</span>
                    <span className="text-sm font-bold text-studio-coral">
                      {selectedSlot?.startTime} – {selectedSlot?.endTime} IST
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-studio-muted font-bold block mb-1">Duration</span>
                    <span className="text-sm font-bold text-studio-navy">{selectedDuration} Hour{selectedDuration > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Creator Details */}
                <div className="pb-6 border-b border-studio-border/60 text-xs space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-studio-muted font-bold block mb-1">Booked For</span>
                  <p className="font-semibold text-studio-charcoal">{customerName} • {customerPhone}</p>
                  <p className="text-studio-muted">{customerEmail}</p>
                  {customerNotes && <p className="italic text-studio-charcoal/80 mt-1">Notes: "{customerNotes}"</p>}
                </div>

                {/* Transparent Price Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-studio-charcoal">
                    <span>Base Studio Rental ({selectedDuration}h @ ₹{quote.baseHourlyRate}/hr)</span>
                    <span className="font-semibold">₹{quote.basePrice}</span>
                  </div>

                  {quote.addons.map((a) => (
                    <div key={a.id} className="flex justify-between text-studio-charcoal/80">
                      <span>{a.name} ({a.priceType === 'per_hour' ? `${selectedDuration}h` : 'flat'})</span>
                      <span className="font-semibold">₹{a.calculatedPrice}</span>
                    </div>
                  ))}

                  <div className="flex justify-between text-studio-charcoal/80 pt-2 border-t border-dashed border-studio-border">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{quote.subtotal}</span>
                  </div>

                  <div className="flex justify-between text-studio-muted">
                    <span>GST ({quote.taxPercentage}%)</span>
                    <span>₹{quote.taxAmount}</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 border-t border-studio-border text-base font-extrabold text-studio-navy">
                    <span>Total Session Fee</span>
                    <span className="text-xl text-studio-coral">₹{quote.totalPrice}</span>
                  </div>
                </div>

                {/* Terms Acceptance Checkbox */}
                <div className="pt-4 border-t border-studio-border/60">
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-studio-charcoal leading-relaxed">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 rounded border-studio-border text-studio-coral focus:ring-studio-coral"
                    />
                    <span>
                      I agree to Content Munch Studio's booking terms and 24-hour cancellation policy. I understand that the studio is sound-controlled and sanitized prior to arrival.
                    </span>
                  </label>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 8: FINAL ATOMIC CONFIRMATION SCREEN */}
          {/* ========================================================================= */}
          {currentStep === 8 && confirmedBooking && (
            <div className="py-6 space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="studio-badge bg-emerald-100 text-emerald-800 mb-2">
                  Simulation Confirmed Locally
                </span>
                <h4 className="text-2xl sm:text-3xl font-bold font-editorial text-studio-navy">
                  Your Studio Slot is Booked!
                </h4>
                <p className="text-xs sm:text-sm text-studio-muted max-w-md mx-auto mt-1">
                  Saved directly to your browser's local storage. This is a frontend demo simulation.
                </p>
              </div>

              {/* Reference Card */}
              <div className="max-w-md mx-auto bg-white border border-studio-border rounded-2xl p-6 text-left space-y-4 shadow-soft">
                <div className="flex items-center justify-between pb-3 border-b border-studio-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-studio-muted tracking-wider">Booking Reference</span>
                    <div className="text-lg font-mono font-bold text-studio-navy">{confirmedBooking.bookingReference}</div>
                  </div>
                  <button
                    onClick={copyRefToClipboard}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-studio-cream hover:bg-studio-cream-dark text-studio-charcoal border border-studio-border transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedRef ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-studio-muted">Service:</span>
                    <span className="font-bold text-studio-navy">{confirmedBooking.serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-studio-muted">Date:</span>
                    <span className="font-bold text-studio-navy">{confirmedBooking.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-studio-muted">Time Interval:</span>
                    <span className="font-bold text-studio-coral">{confirmedBooking.startTime} – {confirmedBooking.endTime} IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-studio-muted">Total Amount:</span>
                    <span className="font-bold text-studio-navy">₹{confirmedBooking.pricing.totalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-studio-muted">Studio Address:</span>
                    <span className="font-medium text-studio-charcoal text-right">Velachery Main Rd, Pallikaranai</span>
                  </div>
                </div>
              </div>

              {/* Notice & Next Steps */}
              <div className="max-w-md mx-auto text-xs text-studio-muted space-y-2 text-left bg-studio-cream/60 p-4 rounded-xl border border-studio-border/60">
                <p className="font-bold text-studio-charcoal">Browser Storage Notice</p>
                <ul className="list-disc list-inside space-y-1 text-studio-charcoal/80">
                  <li>This booking is stored in your current browser's localStorage and is not sent to an external server.</li>
                  <li>You can look up this booking anytime using the reference code in the top bar.</li>
                  <li>The slot is immediately reflected in the Admin Dashboard and calendar.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="bg-studio-navy hover:bg-studio-navy-light text-white px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        {currentStep < 8 && (
          <div className="bg-white border-t border-studio-border px-6 py-4 flex items-center justify-between shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-2 text-xs font-semibold text-studio-charcoal hover:text-studio-navy px-4 py-2.5 rounded-full border border-studio-border hover:bg-studio-cream transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                disabled={
                  (currentStep === 1 && !selectedServiceId) ||
                  (currentStep === 2 && !selectedDate) ||
                  (currentStep === 3 && !selectedSlot) ||
                  (currentStep === 5 && (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()))
                }
                onClick={() => {
                  setErrorMsg(null);
                  setCurrentStep(prev => prev + 1);
                }}
                className="flex items-center gap-2 bg-studio-coral hover:bg-studio-coral-hover text-white text-xs font-semibold uppercase tracking-wider px-6 py-3 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || !acceptTerms}
                onClick={handleConfirmBooking}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider px-8 py-3.5 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Securing Slot...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Book Now</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
