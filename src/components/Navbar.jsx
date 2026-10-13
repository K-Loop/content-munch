import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Phone, Calendar, ArrowRight, ShieldCheck, Search, MessageSquare } from 'lucide-react';
import { useScrollHeader, useActiveSection } from '../lib/useAnimations';

export default function Navbar({ onOpenBooking, onOpenAdmin, onOpenLookup }) {
  const isScrolled = useScrollHeader(24);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);

  const navLinks = [
    { name: 'Studio', href: '#studio', id: 'studio' },
    { name: 'Services', href: '#services', id: 'services' },
    { name: 'Facilities', href: '#facilities', id: 'facilities' },
    { name: 'Gallery', href: '#gallery', id: 'gallery' },
    { name: 'Pricing', href: '#pricing', id: 'pricing' },
    { name: 'FAQs', href: '#faqs', id: 'faqs' },
    { name: 'Contact', href: '#contact', id: 'contact' },
  ];

  const activeSection = useActiveSection(navLinks.map((l) => l.id));

  // Lock body scroll and handle Escape key when mobile menu is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 animate-nav-entrance ${
        isScrolled
          ? 'bg-[#FBF9F5]/96 backdrop-blur-md shadow-xs border-b border-studio-border/80 py-3 md:py-3.5'
          : 'bg-[#FBF9F5] border-b border-transparent py-5 md:py-6'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Main 3-Column Navigation Grid */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 xl:grid xl:grid-cols-12 xl:items-center">
          
          {/* GROUP 1 (Left): Brand Logo & Name */}
          <div className="xl:col-span-3 flex items-center">
            <a
              href="#"
              className="flex items-center gap-2.5 sm:gap-3 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-studio-coral rounded-xl p-1 -m-1 transition-transform active:scale-95"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-studio-navy flex items-center justify-center p-1.5 shadow-xs shrink-0 transition-transform group-hover:scale-105">
                <img
                  src="https://socialangadi.com/wp-content/uploads/2022/02/cropped-SA_Logo_120-1-32x32.png"
                  alt="Social Angadi Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="text-white font-bold text-xs">CM</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-editorial text-base sm:text-lg xl:text-xl font-bold tracking-tight text-studio-navy group-hover:text-studio-coral transition-colors">
                    Content Munch
                  </span>
                  <span className="text-[9px] tracking-widest uppercase bg-studio-navy/5 text-studio-navy font-bold px-1.5 py-0.5 rounded">
                    Studio
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-studio-muted tracking-wide -mt-0.5 truncate">
                  By Social Angadi • Chennai
                </p>
              </div>
            </a>
          </div>

          {/* GROUP 2 (Center): Clean, Spacious Navigation Links (Desktop 1200px+) */}
          <nav
            aria-label="Main Navigation"
            className="hidden xl:flex xl:col-span-6 items-center justify-center gap-6 2xl:gap-8 text-[13px] 2xl:text-[14px]"
          >
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={`nav-link ${isActive ? 'active' : ''} focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-studio-coral rounded-md`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* GROUP 3 (Right): Contact & Single Dominant CTA (Desktop 1200px+) */}
          <div className="hidden xl:flex xl:col-span-3 items-center justify-end gap-3 2xl:gap-4">
            
            {/* Secondary Action: Lookup Booking */}
            <button
              type="button"
              onClick={onOpenLookup}
              className="text-[12px] font-semibold text-studio-charcoal/80 hover:text-studio-coral transition-colors py-1.5 px-2.5 rounded-lg hover:bg-studio-cream-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-studio-coral cursor-pointer"
            >
              Check Booking
            </button>

            {/* Compact Phone Badge (visible on screens >= 1340px to keep spacing generous) */}
            <a
              href="tel:+919489680339"
              className="hidden 2xl:inline-flex items-center gap-1.5 text-[12px] font-semibold text-studio-navy/80 hover:text-studio-coral transition-colors py-1.5 px-3 rounded-full bg-white border border-studio-border/80 shadow-2xs hover:border-studio-coral/40"
              title="Call studio directly"
            >
              <Phone className="w-3 h-3 text-studio-coral" />
              <span>94896 80339</span>
            </a>

            {/* Primary Dominant CTA: Book Your Slot */}
            <button
              type="button"
              onClick={onOpenBooking}
              className="btn-cta-primary inline-flex items-center justify-center gap-2 bg-studio-coral hover:bg-studio-coral-hover text-white px-5 2xl:px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-studio-coral active:scale-95 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Book Your Slot</span>
            </button>
          </div>

          {/* Tablet & Mobile Header Right Actions (< 1200px) */}
          <div className="flex xl:hidden items-center gap-2 sm:gap-3">
            
            {/* Secondary Action: Check Booking on tablet (768px–1199px) */}
            <button
              type="button"
              onClick={onOpenLookup}
              className="hidden md:inline-flex text-xs font-semibold text-studio-charcoal/80 hover:text-studio-coral transition-colors py-1.5 px-2.5 rounded-lg hover:bg-studio-cream-dark cursor-pointer"
            >
              Check Booking
            </button>

            {/* Dominant CTA Button */}
            <button
              type="button"
              onClick={onOpenBooking}
              className="btn-cta-primary bg-studio-coral hover:bg-studio-coral-hover text-white text-xs font-bold uppercase tracking-wider px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Book Your Slot</span>
              <span className="sm:hidden">Book</span>
            </button>

            {/* Menu Toggle Button */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 sm:p-2.5 rounded-xl text-studio-navy hover:text-studio-coral hover:bg-studio-cream transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-studio-coral cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE & TABLET DRAWER (ACCESSIBLE, STAGGERED, RESPONSIVE) */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          ref={drawerRef}
          className="xl:hidden fixed inset-x-0 top-[65px] sm:top-[73px] bottom-0 z-50 bg-studio-navy/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div className="bg-[#FBF9F5] border-b border-studio-border shadow-elevated px-6 py-6 max-h-[calc(100vh-75px)] overflow-y-auto space-y-6 animate-in slide-in-from-top-4 duration-300">
            
            {/* Primary Action inside Menu */}
            <div className="pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full flex items-center justify-center gap-2.5 bg-studio-coral hover:bg-studio-coral-hover text-white py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-md transition-all active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Your Slot Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col space-y-1 divide-y divide-studio-border/50 text-base font-semibold text-studio-navy">
              {navLinks.map((link, idx) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-3 flex items-center justify-between transition-colors ${
                      isActive ? 'text-studio-coral font-bold pl-2' : 'hover:text-studio-coral'
                    }`}
                  >
                    <span>{link.name}</span>
                    <ArrowRight className={`w-4 h-4 text-studio-coral/60 transition-transform ${isActive ? 'translate-x-1' : ''}`} />
                  </a>
                );
              })}
            </nav>

            {/* Quick Actions & Contact Links */}
            <div className="pt-4 border-t border-studio-border/70 space-y-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLookup();
                }}
                className="w-full p-3 rounded-xl bg-white border border-studio-border text-left text-xs font-semibold text-studio-charcoal flex items-center justify-between hover:border-studio-coral transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-studio-coral" />
                  <span>Check Existing Booking Status</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-studio-muted" />
              </button>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <a
                  href="tel:+919489680339"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white border border-studio-border text-xs font-semibold text-studio-navy hover:text-studio-coral transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-studio-coral" />
                  <span>Call Studio</span>
                </a>
                <a
                  href="https://wa.me/919489680339?text=Hi%20Content%20Munch%20Studio%2C%20I%20would%20like%20to%20inquire%20about%20booking%20a%20slot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Staff Portal Link */}
              <div className="pt-2 text-center">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-studio-muted hover:text-studio-navy py-1 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-studio-coral" />
                  <span>Staff & Director Portal</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}
