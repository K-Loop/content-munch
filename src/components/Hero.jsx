import React from 'react';
import { Calendar, ArrowRight, Sparkles, CheckCircle2, Shield, Clock, Video, Mic } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

export default function Hero({ onOpenBooking }) {
  const benefits = [
    { icon: Sparkles, label: 'Fully Furnished Studio' },
    { icon: Video, label: 'Professional Lighting' },
    { icon: CheckCircle2, label: 'Multiple Backdrops & Props' },
    { icon: Mic, label: 'Sound-Controlled Space' },
    { icon: Clock, label: 'Flexible Hourly Rental' },
    { icon: Shield, label: 'Optional Camera Support' },
  ];

  return (
    <section className="relative pt-6 pb-16 md:pt-12 md:pb-24 lg:pb-28 overflow-hidden bg-gradient-to-b from-[#FBF9F5] via-[#FAF6EE] to-[#F5EFE3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-studio-border shadow-xs text-xs font-semibold text-studio-navy mb-6 sm:mb-8 animate-hero-fade">
          <span className="w-2 h-2 rounded-full bg-studio-coral animate-ping shrink-0" aria-hidden="true"></span>
          <span className="truncate">Chennai’s Premium Hourly Creator Studio • Pallikaranai</span>
        </div>

        {/* Hero Grid: Balanced 2-Column on Desktop, Natural Vertical Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12 items-center">
          
          {/* Left Column: Editorial Headline & Copy */}
          <div className="lg:col-span-6 space-y-6">
            
            <h1 className="editorial-title font-bold tracking-tight text-studio-navy leading-[1.12] text-[clamp(2.25rem,4.5vw+1rem,3.75rem)]">
              <span className="block animate-hero-fade">Your Space.</span>
              <span className="block text-studio-coral italic font-normal animate-hero-fade delay-100">Your Story.</span>
              <span className="block animate-hero-fade delay-200">Your Studio.</span>
            </h1>

            <p className="text-base sm:text-lg text-studio-charcoal/80 leading-relaxed max-w-xl font-normal animate-hero-fade delay-300">
              A fully equipped content creation studio in Chennai for creators, brands, podcasters, and businesses. Walk in, record high-impact content, and leave the equipment and setup to us.
            </p>

            {/* CTAs with Micro-interactions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2 animate-hero-fade delay-400">
              <button
                type="button"
                onClick={onOpenBooking}
                className="btn-cta-primary inline-flex items-center justify-center gap-2.5 bg-studio-coral hover:bg-studio-coral-hover text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider text-xs shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-studio-coral active:scale-95 cursor-pointer"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Book Your Slot</span>
                <ArrowRight className="w-4 h-4 shrink-0 cta-icon" />
              </button>

              <a
                href="#studio"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-studio-cream border border-studio-border text-studio-navy px-7 py-4 rounded-full font-semibold text-xs tracking-wider uppercase transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-studio-coral active:scale-95"
              >
                <span>Explore Studio</span>
              </a>
            </div>

            {/* Benefit Highlights Matrix */}
            <div className="pt-6 sm:pt-8 border-t border-studio-border/70 animate-hero-fade delay-400">
              <p className="text-[11px] font-bold uppercase tracking-wider text-studio-muted mb-3 sm:mb-4">
                What makes Content Munch Studio stand out
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {benefits.map((b, idx) => {
                  const Icon = b.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white/80 backdrop-blur-xs border border-studio-border/70 p-2.5 rounded-xl hover:border-studio-coral/40 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-studio-coral shrink-0" />
                      <span className="text-xs font-medium text-studio-charcoal leading-tight">{b.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Studio Photography Showcase */}
          <div className="lg:col-span-6 relative mt-4 lg:mt-0">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              
              {/* Primary Studio Main Shot (Authentic photograph from Social Angadi) */}
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-floating border-4 border-white bg-white animate-hero-scale">
                <ImageWithFallback
                  src="https://socialangadi.com/wp-content/uploads/2025/11/IMG_2317-scaled.jpg"
                  alt="Content Munch Studio Chennai Main Stage"
                  aspectRatio="aspect-[4/3]"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-103"
                  fallbackText="Main Studio Floor"
                />
                
                {/* Floating Studio Badge */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-4 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-studio-border/80 shadow-soft flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-studio-coral block truncate">Ready to shoot</span>
                    <h4 className="text-xs sm:text-sm font-bold text-studio-navy truncate">Content Munch Studio A</h4>
                    <p className="text-[11px] text-studio-muted truncate">Sound-dampened • Lighting grid ready</p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenBooking}
                    className="bg-studio-navy text-white text-xs font-semibold px-3.5 sm:px-4 py-2 rounded-xl hover:bg-studio-coral transition-colors shrink-0 active:scale-95 cursor-pointer"
                  >
                    Select Slot
                  </button>
                </div>
              </div>

              {/* Decorative Secondary Studio Shot in Corner (Hidden on mobile to prevent overflow) */}
              <div className="hidden sm:block absolute -top-6 -right-4 lg:-top-8 lg:-right-6 z-20 w-36 sm:w-44 rounded-2xl overflow-hidden shadow-elevated border-3 border-white bg-white animate-gentle-float">
                <ImageWithFallback
                  src="https://socialangadi.com/wp-content/uploads/2025/11/IMG_2313-scaled.jpg"
                  alt="Content Munch Studio Backdrop and Lighting"
                  aspectRatio="aspect-square"
                  className="w-full h-full object-cover"
                  fallbackText="Lighting Rig"
                />
              </div>

              {/* Decorative Ambient Radial Glow */}
              <div
                className="absolute -bottom-8 -left-8 z-0 w-40 h-40 rounded-full bg-studio-coral/10 blur-3xl pointer-events-none"
                aria-hidden="true"
              ></div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

