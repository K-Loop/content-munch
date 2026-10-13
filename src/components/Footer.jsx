import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

export default function Footer({ onOpenAdmin, onOpenBooking, onOpenLookup }) {
  return (
    <footer className="bg-studio-navy text-white pt-16 pb-12 border-t border-studio-navy-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Col */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center p-1">
                <img 
                  src="https://socialangadi.com/wp-content/uploads/2022/02/cropped-SA_Logo_120-1-32x32.png" 
                  alt="Social Angadi Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="text-white font-bold text-xs">CM</span>
              </div>
              <span className="font-editorial text-2xl font-bold tracking-tight">
                Content Munch Studio
              </span>
            </div>
            
            <p className="text-xs text-white/70 max-w-sm leading-relaxed">
              Chennai’s dedicated hourly-rental content creation studio by Social Angadi. Fully furnished, sound-controlled environment equipped for YouTubers, Instagram creators, podcasters, brands, and businesses.
            </p>

            {/* Social Links (Verified from Social Angadi reference) */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/socialangadi/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-studio-coral flex items-center justify-center text-xs font-semibold transition-colors"
                aria-label="Instagram"
              >
                IG
              </a>
              <a
                href="https://www.facebook.com/socialangadi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-studio-coral flex items-center justify-center text-xs font-semibold transition-colors"
                aria-label="Facebook"
              >
                FB
              </a>
              <a
                href="https://twitter.com/AngadiSocial"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-studio-coral flex items-center justify-center text-xs font-semibold transition-colors"
                aria-label="Twitter / X"
              >
                X
              </a>
              <a
                href="https://www.youtube.com/channel/UCuS_X_L4UtzGC1YnCyNihww"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-studio-coral flex items-center justify-center text-xs font-semibold transition-colors"
                aria-label="YouTube"
              >
                YT
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-studio-coral">Quick Navigation</h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li><a href="#studio" className="hover:text-white transition-colors">The Studio</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Rental Services</a></li>
              <li><a href="#facilities" className="hover:text-white transition-colors">Studio Facilities</a></li>
              <li><a href="#gallery" className="hover:text-white transition-colors">Photo Gallery</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Rates & Pricing</a></li>
              <li><a href="#faqs" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
              <li><button onClick={onOpenLookup} className="hover:text-white transition-colors text-left">Check Existing Booking</button></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-studio-coral">Studio Address</h4>
            <p className="text-xs text-white/70 leading-relaxed">
              45, Plot 3, FIRST FLOOR, Velachery Main Road, Madipakkam Main Road, Pallikaranai, Chennai-600091
            </p>
            <div className="space-y-1 pt-1 text-xs text-white/80">
              <p>Phone: <a href="tel:+919489680339" className="hover:text-white">+91 94896 80339</a></p>
              <p>Email: <a href="mailto:Socialangadi@gmail.com" className="hover:text-white">Socialangadi@gmail.com</a></p>
            </div>
            <div className="pt-2">
              <button
                onClick={onOpenBooking}
                className="bg-studio-coral hover:bg-studio-coral-hover text-white px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
              >
                Book Studio Slot
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Content Munch Studio by Social Angadi. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <span>Chennai, Tamil Nadu</span>
            <button
              onClick={onOpenAdmin}
              className="text-white/60 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-studio-coral" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
