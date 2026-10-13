import React, { useState } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

// Authentic photographs directly from Social Angadi Content Munch Studio
const GALLERY_ITEMS = [
  {
    id: 1,
    title: 'Main Studio Production Floor',
    category: 'Full Studio',
    caption: 'Sound-dampened 400 sq.ft main creation floor with modular creator furniture and overhead lighting.',
    src: 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2317-scaled.jpg',
    aspect: 'col-span-1 md:col-span-2 row-span-2 aspect-[16/10]',
  },
  {
    id: 2,
    title: 'Podcast & Discussion Set',
    category: 'Podcast Set',
    caption: 'Comfortable acoustic conversation setup configured for 2-4 speaker video podcasts.',
    src: 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2313-scaled.jpg',
    aspect: 'col-span-1 aspect-[4/5]',
  },
  {
    id: 3,
    title: 'Vertical Video & Reels Bay',
    category: 'Reels / Shorts',
    caption: 'Color-calibrated lighting and backdrop sweeps for high-velocity short-form reels.',
    src: 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2312-scaled.jpg',
    aspect: 'col-span-1 aspect-[4/5]',
  },
  {
    id: 4,
    title: 'Lighting Rig & Acoustic Treatment',
    category: 'Lighting Rig',
    caption: 'Continuous professional Godox softboxes, rimlights, and acoustic wall panels.',
    src: 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2310-scaled.jpg',
    aspect: 'col-span-1 aspect-[4/5]',
  },
  {
    id: 5,
    title: 'Multi-Backdrop Stage',
    category: 'Backdrops',
    caption: 'Seamless backdrop rolls in neutral tones and vibrant colors for brand aesthetics.',
    src: 'https://socialangadi.com/wp-content/uploads/2025/11/IMG_2318-1024x576.jpg',
    aspect: 'col-span-1 md:col-span-2 aspect-[16/9]',
  },
];

export default function Gallery() {
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  const openLightbox = (index) => setActivePhotoIndex(index);
  const closeLightbox = () => setActivePhotoIndex(null);

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : GALLERY_ITEMS.length - 1));
  };

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev < GALLERY_ITEMS.length - 1 ? prev + 1 : 0));
  };

  return (
    <section id="gallery" className="scroll-mt-24 md:scroll-mt-28 py-20 md:py-28 bg-[#FBF9F5] border-t border-studio-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 reveal-on-scroll">
          <span className="studio-badge bg-studio-coral-light text-studio-coral">
            Inside The Studio
          </span>
          <h2 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-bold text-studio-navy">
            Actual Studio Spaces & Sets
          </h2>
          <p className="text-base text-studio-muted leading-relaxed">
            Real photography of Content Munch Studio in Pallikaranai, Chennai. Click any image to view details and full-resolution frame.
          </p>
        </div>

        {/* Editorial Masonry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal-on-scroll delay-100">
          {GALLERY_ITEMS.map((item, index) => (
            <div
              key={item.id}
              tabIndex={0}
              role="button"
              aria-label={`View photo: ${item.title}`}
              onClick={() => openLightbox(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openLightbox(index);
                }
              }}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer bg-white border border-studio-border/80 shadow-soft hover:shadow-elevated transition-all duration-300 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-studio-coral ${item.aspect}`}
            >
              <ImageWithFallback
                src={item.src}
                alt={item.title}
                aspectRatio="w-full h-full"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                fallbackText={item.title}
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-studio-navy/80 via-studio-navy/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-studio-coral mb-1">
                  {item.category}
                </span>
                <h4 className="text-lg font-bold font-editorial">{item.title}</h4>
                <p className="text-xs text-white/80 line-clamp-2 mt-1">{item.caption}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-white/90 font-medium">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Click to expand</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Photo Attribution Notice */}
        <div className="mt-8 text-center text-xs text-studio-muted">
          <p>
            Photography sourced from Social Angadi's studio documentation. All images show authentic interior setups at Content Munch Studio, Chennai.
          </p>
        </div>

      </div>

      {/* Fullscreen Lightbox Modal */}
      {activePhotoIndex !== null && (
        <div className="fixed inset-0 z-50 bg-studio-navy/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close image modal"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={prevPhoto}
            className="absolute left-4 md:left-8 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextPhoto}
            className="absolute right-4 md:right-8 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center">
            <div className="rounded-2xl overflow-hidden border border-white/20 max-h-[70vh] bg-black">
              <img
                src={GALLERY_ITEMS[activePhotoIndex].src}
                alt={GALLERY_ITEMS[activePhotoIndex].title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="mt-4 text-center text-white space-y-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-studio-coral">
                {GALLERY_ITEMS[activePhotoIndex].category}
              </span>
              <h3 className="text-xl font-bold font-editorial">
                {GALLERY_ITEMS[activePhotoIndex].title}
              </h3>
              <p className="text-xs text-white/70 max-w-xl mx-auto">
                {GALLERY_ITEMS[activePhotoIndex].caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
