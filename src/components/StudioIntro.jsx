import React from 'react';
import { Users, Video, Mic, Smartphone, ShoppingBag, GraduationCap, Building2, Briefcase, Check } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

export default function StudioIntro({ onOpenBooking }) {
  const audiences = [
    { icon: Smartphone, title: 'Instagram Reels Creators', desc: 'Aesthetic sets with vertical framing rigs and ambient RGB lighting.' },
    { icon: Video, title: 'YouTubers & Video Creators', desc: 'Spacious floor, teleprompter compatibility, and consistent key lighting.' },
    { icon: Mic, title: 'Podcasters & Hosts', desc: 'Acoustically sound-controlled setting for conversational audio & video pods.' },
    { icon: ShoppingBag, title: 'Brands & Product Creators', desc: 'Product tables, top-down rigs, and clean backdrops for unboxings and ads.' },
    { icon: GraduationCap, title: 'Educators & Course Creators', desc: 'Comfortable presentation environment for masterclasses and step-by-step tutorials.' },
    { icon: Building2, title: 'Corporate & Executive Teams', desc: 'Polished executive video setups for interviews, thought leadership, and PR.' },
    { icon: Briefcase, title: 'Marketing Agencies', desc: 'Cost-effective high-yield studio rental for client campaigns without overhead.' },
    { icon: Users, title: 'Influencers & Founders', desc: 'Personal branding reels, talking-head shorts, and announcements.' },
  ];

  return (
    <section id="studio" className="scroll-mt-24 md:scroll-mt-28 py-20 md:py-28 bg-white border-t border-studio-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 reveal-on-scroll">
          <span className="studio-badge bg-studio-coral-light text-studio-coral">
            About The Space
          </span>
          <h2 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-bold text-studio-navy">
            Built Exclusively for Creators Who Value Their Craft
          </h2>
          <p className="text-base text-studio-muted leading-relaxed">
            Content Munch Studio is an accessible, fully appointed content creation studio located in Chennai, designed for creators who want to produce high-impact content without investing lakhs in specialized equipment and soundproofing.
          </p>
        </div>

        {/* Mission Statement Box */}
        <div className="bg-studio-cream border border-studio-border/80 rounded-3xl p-8 sm:p-10 mb-20 relative overflow-hidden shadow-soft reveal-on-scroll delay-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-studio-coral">Our Core Mission</span>
              <h3 className="editorial-title text-2xl sm:text-3xl font-bold text-studio-navy">
                “Make content creation easier, faster, and more affordable for every creator.”
              </h3>
              <p className="text-sm text-studio-charcoal/80">
                Forget spending hours setting up softboxes, dealing with family noise, or struggling with cluttered backgrounds. Walk in with your ideas, record uninterrupted, and leave the equipment and studio management to us.
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <button
                type="button"
                onClick={onOpenBooking}
                className="btn-cta-primary bg-studio-navy hover:bg-studio-navy-light text-white px-7 py-3.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Reserve Your Time
              </button>
            </div>
          </div>
        </div>

        {/* Target Audience Matrix */}
        <div className="space-y-6 reveal-on-scroll delay-200">
          <div className="text-center">
            <h3 className="text-xl font-bold text-studio-navy">Who Uses Content Munch Studio?</h3>
            <p className="text-xs text-studio-muted mt-1">Versatile configurations tailored for every content format</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {audiences.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="p-6 rounded-2xl bg-studio-cream/40 border border-studio-border/70 hover:border-studio-coral/60 transition-all hover:bg-white hover:shadow-soft group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-studio-border flex items-center justify-center text-studio-coral mb-4 group-hover:bg-studio-coral group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-studio-navy mb-2">{item.title}</h4>
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
