import React from 'react';
import { Sparkles, Sun, Layers, VolumeX, Clock4, Video, ShieldCheck, Zap } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

export default function Facilities() {
  const amenities = [
    {
      icon: Sparkles,
      title: 'Furnished Studio Layout',
      desc: 'Modular creator furniture including armchairs, podcast discussion table, stools, and minimalist staging sets.'
    },
    {
      icon: Sun,
      title: 'Professional Lighting Grid',
      desc: 'Overhead and stand-mounted Godox softboxes, keylights, rimlights, and RGB color tube lights ready to illuminate your shoot.'
    },
    {
      icon: Layers,
      title: 'Multiple Backdrops & Props',
      desc: 'Seamless colored paper sweeps, neutral textured backdrops, greenscreen, and aesthetic production props.'
    },
    {
      icon: VolumeX,
      title: 'Sound-Controlled Space',
      desc: 'Acoustically dampened recording environment designed to minimize echo and external street noise during audio capture.'
    },
    {
      icon: Clock4,
      title: 'Flexible Hourly Rental',
      desc: 'Rent only the hours you need. No monthly lock-in contracts or expensive studio retainers.'
    },
    {
      icon: Video,
      title: 'Optional Camera Support',
      desc: 'Need an operator? Add our professional 4K camera package with dedicated operator during checkout.'
    },
    {
      icon: Zap,
      title: 'Air Conditioned & High-Speed WiFi',
      desc: 'Full climate control keeps your cast and crew comfortable throughout long production sessions.'
    },
    {
      icon: ShieldCheck,
      title: 'Sanitized & Reset Between Sessions',
      desc: '15-minute buffer built into every reservation ensures a spotless, prepared floor for your arrival.'
    }
  ];

  return (
    <section id="facilities" className="scroll-mt-24 md:scroll-mt-28 py-20 md:py-28 bg-white border-t border-studio-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 reveal-on-scroll">
          <span className="studio-badge bg-studio-coral-light text-studio-coral">
            Facilities & Amenities
          </span>
          <h2 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-bold text-studio-navy">
            Everything You Need Under One Roof
          </h2>
          <p className="text-base text-studio-muted leading-relaxed">
            Content Munch Studio is engineered for efficient production workflows. Walk in with your script or products and start recording immediately.
          </p>
        </div>

        {/* 2-Column Split: Visuals + Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center reveal-on-scroll delay-100">
          
          {/* Left Column: Visual Showcase */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl overflow-hidden shadow-elevated border-2 border-studio-border bg-white">
              <ImageWithFallback
                src="https://socialangadi.com/wp-content/uploads/2025/11/IMG_2313-scaled.jpg"
                alt="Lighting and Backdrops at Content Munch Studio"
                aspectRatio="aspect-[4/5]"
                fallbackText="Studio Lighting & Setup"
              />
            </div>
            <div className="p-6 rounded-2xl bg-studio-cream border border-studio-border/80">
              <h4 className="text-sm font-bold text-studio-navy mb-1">Chennai Studio Location</h4>
              <p className="text-xs text-studio-charcoal/80 leading-relaxed">
                45, Plot 3, First Floor, Velachery Main Road, Madipakkam Main Road, Pallikaranai, Chennai - 600091. Easy parking & lift access.
              </p>
            </div>
          </div>

          {/* Right Column: Amenities Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {amenities.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-5 rounded-2xl bg-studio-cream/30 border border-studio-border/70 hover:border-studio-coral/50 transition-all hover:bg-white hover:shadow-soft">
                  <div className="w-9 h-9 rounded-xl bg-white border border-studio-border flex items-center justify-center text-studio-coral mb-3 shadow-2xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-studio-navy mb-1.5">{item.title}</h3>
                  <p className="text-xs text-studio-muted leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
