import React from 'react';
import { ArrowRight, Clock, Video, Sparkles, Check, Camera } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

// Stable authentic studio photos from the website for service visuals
const SERVICE_IMAGES = {
  'content-creator-rental': 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2317-scaled.jpg',
  'instagram-reels-shoots': 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2312-scaled.jpg',
  'youtube-video-production': 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2318-1024x576.jpg',
  'podcast-recording': 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2310-scaled.jpg',
  'interviews-talking-head': 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2313-scaled.jpg',
  'product-photography-videos': 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2312-scaled.jpg',
  'tutorials-educational': 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2317-scaled.jpg',
  'corporate-video-content': 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2318-1024x576.jpg',
};

export default function Services({ services = [], onSelectService }) {
  return (
    <section id="services" className="scroll-mt-24 md:scroll-mt-28 py-20 md:py-28 bg-[#FAF7F2] border-t border-studio-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 reveal-on-scroll">
          <span className="studio-badge bg-studio-coral-light text-studio-coral">
            Tailored Experiences
          </span>
          <h2 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-bold text-studio-navy">
            Studio Rental & Production Services
          </h2>
          <p className="text-base text-studio-muted leading-relaxed">
            Every session includes exclusive access to our furnished studio floor, continuous lighting, backdrops, and acoustic dampening. Optional professional camera support can be added at checkout.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal-on-scroll delay-100">
          {services.map((service) => {
            const imgUrl = SERVICE_IMAGES[service.slug] || 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2317-scaled.jpg';
            
            return (
              <div
                key={service.id}
                className="studio-card flex flex-col justify-between overflow-hidden group bg-white"
              >
                <div>
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-studio-cream-dark">
                    <ImageWithFallback
                      src={imgUrl}
                      alt={service.name}
                      aspectRatio="aspect-[16/10]"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackText={service.name}
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-studio-navy px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                      ₹{service.base_hourly_rate}/hr
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-studio-muted mb-2">
                      <Clock className="w-3.5 h-3.5 text-studio-coral" />
                      <span>Min. {service.min_duration_hours || 1} Hour Session</span>
                    </div>

                    <h3 className="text-xl font-bold text-studio-navy mb-3 group-hover:text-studio-coral transition-colors">
                      {service.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-studio-charcoal/80 leading-relaxed mb-4">
                      {service.description}
                    </p>

                    <div className="space-y-1.5 pt-3 border-t border-studio-border/60">
                      <div className="flex items-center gap-2 text-xs text-studio-charcoal/90">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Furnished studio space & lighting included</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-studio-charcoal/90">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Acoustic sound-treated environment</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-studio-muted">
                        <Camera className="w-3.5 h-3.5 text-studio-coral shrink-0" />
                        <span>Optional camera operator available</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => onSelectService(service)}
                    className="w-full flex items-center justify-center gap-2 bg-studio-cream hover:bg-studio-coral hover:text-white text-studio-navy border border-studio-border hover:border-transparent py-3 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all shadow-2xs"
                  >
                    <span>Book This Service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Disclaimer Note regarding rental vs production equipment */}
        <div className="mt-12 p-4 rounded-xl bg-white border border-studio-border/80 text-center max-w-2xl mx-auto shadow-2xs">
          <p className="text-xs text-studio-muted leading-relaxed">
            <span className="font-semibold text-studio-charcoal">Studio Note:</span> Base rental rates cover exclusive studio space, continuous lighting, backdrops, and acoustic treatment. Camera gear, operators, and prompters are available as optional add-ons during checkout.
          </p>
        </div>

      </div>
    </section>
  );
}
