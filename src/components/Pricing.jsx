import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles, Shield, Clock, HelpCircle } from 'lucide-react';

export default function Pricing({ services = [], addons = [], settings = {}, onOpenBookingWithService }) {
  const [selectedDuration, setSelectedDuration] = useState(2); // default 2 hours

  const baseRate = parseInt(settings.base_hourly_rate || '1499', 10);
  const taxPercent = parseInt(settings.applicable_tax_percentage || '18', 10);
  const cancellationPolicy = settings.cancellation_policy || 'Free cancellation up to 24 hours prior to scheduled slot.';

  // Packages
  const packages = [
    {
      name: 'Creator Quick Shoot',
      subtitle: 'Ideal for Instagram Reels & Shorts',
      hours: 1,
      rateMultiplier: 1,
      features: [
        '1 Hour exclusive studio access',
        'Continuous Godox lighting setup',
        'Seamless color backdrops',
        'Acoustically sound-controlled space',
        '15-min preparation buffer included',
        'Self-directed or bring your team',
      ],
      popular: false,
    },
    {
      name: 'Production Session',
      subtitle: 'Most popular for YouTube & Podcasts',
      hours: 2,
      rateMultiplier: 2,
      features: [
        '2 Hours exclusive studio access',
        'Full lighting grid + RGB tube lights',
        'Multi-speaker podcast table setup',
        'High-speed WiFi for live transfers',
        'Teleprompter mount access',
        'Air-conditioned comfort throughout',
      ],
      popular: true,
    },
    {
      name: 'Half-Day Creator Block',
      subtitle: 'Best for batching multiple videos',
      hours: 4,
      rateMultiplier: 3.8, // slight bulk benefit
      features: [
        '4 Hours deep production block',
        'Multiple set & backdrop switches',
        'Complete creator staging area',
        'Dedicated studio host on standby',
        'Full equipment reset assistance',
        'Refreshments & studio green room',
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="scroll-mt-24 md:scroll-mt-28 py-20 md:py-28 bg-white border-t border-studio-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 reveal-on-scroll">
          <span className="studio-badge bg-studio-coral-light text-studio-coral">
            Transparent Pricing
          </span>
          <h2 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-bold text-studio-navy">
            Straightforward Hourly Rates
          </h2>
          <p className="text-base text-studio-muted leading-relaxed">
            All prices are backed by live studio settings. No hidden fees, no equipment surprise costs. Walk in, record, and leave the setup to us.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 reveal-on-scroll delay-100">
          {packages.map((pkg, index) => {
            const calculatedBase = Math.round(baseRate * pkg.rateMultiplier);
            const calculatedTax = Math.round((calculatedBase * taxPercent) / 100);
            const totalWithTax = calculatedBase + calculatedTax;

            return (
              <div
                key={index}
                className={`studio-card relative p-8 flex flex-col justify-between ${
                  pkg.popular ? 'border-studio-coral ring-2 ring-studio-coral/20' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-studio-coral text-white px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Creator Choice</span>
                  </div>
                )}

                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold font-editorial text-studio-navy">{pkg.name}</h3>
                    <p className="text-xs text-studio-muted mt-1">{pkg.subtitle}</p>
                  </div>

                  <div className="mb-6 p-4 rounded-xl bg-studio-cream border border-studio-border/80">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-studio-navy">₹{calculatedBase.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-studio-muted">/ {pkg.hours} hr{pkg.hours > 1 ? 's' : ''}</span>
                    </div>
                    <div className="text-[11px] text-studio-muted mt-1 flex items-center justify-between">
                      <span>+ {taxPercent}% GST (₹{calculatedTax.toLocaleString('en-IN')})</span>
                      <span className="font-semibold text-studio-charcoal">₹{totalWithTax.toLocaleString('en-IN')} total</span>
                    </div>
                  </div>

                  {/* Feature list */}
                  <div className="space-y-3 mb-8">
                    {pkg.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-studio-charcoal">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => {
                      if (services.length > 0) {
                        onOpenBookingWithService(services[0]);
                      }
                    }}
                    className={`w-full py-3.5 rounded-full font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
                      pkg.popular
                        ? 'bg-studio-coral hover:bg-studio-coral-hover text-white shadow-md'
                        : 'bg-studio-navy hover:bg-studio-navy-light text-white'
                    }`}
                  >
                    <span>Reserve {pkg.hours} Hour Slot</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Optional Add-Ons Table */}
        <div className="bg-studio-cream border border-studio-border/80 rounded-2xl p-8 mb-12 shadow-2xs reveal-on-scroll delay-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold font-editorial text-studio-navy">Optional Production Add-Ons</h3>
              <p className="text-xs text-studio-muted">Add any of these services during step 5 of the booking checkout</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-white rounded-full border border-studio-border text-studio-charcoal">
              A La Carte Upgrades
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {addons.map((addon) => (
              <div key={addon.id} className="p-4 rounded-xl bg-white border border-studio-border/70 flex flex-col justify-between hover:border-studio-coral/50 transition-colors">
                <div>
                  <h4 className="font-bold text-sm text-studio-navy mb-1">{addon.name}</h4>
                  <p className="text-xs text-studio-muted line-clamp-2 mb-3">{addon.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-studio-border/40 text-xs">
                  <span className="font-bold text-studio-coral">₹{addon.price}</span>
                  <span className="text-studio-muted text-[11px] capitalize">{addon.price_type === 'per_hour' ? 'per hour' : 'flat fee'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Studio Cancellation Policy Notice */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3 max-w-3xl mx-auto reveal-on-scroll delay-200">
          <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold">Cancellation & Rescheduling Policy:</strong> {cancellationPolicy} Need a customized full-day commercial setup? Call us directly at <a href="tel:+919489680339" className="underline font-bold">+91 94896 80339</a>.
          </p>
        </div>

      </div>
    </section>
  );
}
