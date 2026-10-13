import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FaqSection({ settings = {} }) {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'How do I book a slot at Content Munch Studio?',
      a: 'Booking is completely seamless online. Click any "Book Your Slot" button on this website, select your content type (Reels, YouTube, Podcast, etc.), choose your date and start time, configure any optional camera add-ons, and confirm your reservation. You will immediately receive a unique booking reference code.'
    },
    {
      q: 'What equipment and amenities are included in the base hourly rental?',
      a: 'Every reservation includes exclusive access to our 400 sq.ft furnished studio, overhead and stand-mounted continuous Godox softboxes, RGB mood tube lights, multiple seamless backdrop rolls, creator furniture, air conditioning, and high-speed WiFi. The space is sound-controlled for clean voice capture.'
    },
    {
      q: 'Do you provide a camera operator or camera gear?',
      a: 'Yes! While many creators bring their own smartphones or mirrorless cameras, you can select our "Professional Camera Support & Operator" add-on during checkout. Our studio operator will frame, monitor, and capture 4K footage for you throughout the session.'
    },
    {
      q: 'What is the minimum booking duration?',
      a: 'The minimum rental duration is 1 hour for general content creator rentals, Instagram reels, and podcasts, and 2 hours for extensive YouTube or corporate multi-camera sessions. You can extend your session in 1-hour increments.'
    },
    {
      q: 'What is your rescheduling and cancellation policy?',
      a: settings.cancellation_policy || 'You can reschedule or cancel free of charge up to 24 hours prior to your scheduled start time. Cancellations within 24 hours are subject to a 50% reservation fee.'
    },
    {
      q: 'When should I arrive for my session?',
      a: 'We recommend arriving 10 minutes prior to your reserved slot. Every booking automatically includes a complimentary 15-minute studio buffer before and after your reservation to ensure the floor is pristine and ready.'
    },
    {
      q: 'Where is Content Munch Studio located in Chennai?',
      a: 'We are conveniently located at 45, Plot 3, First Floor, Velachery Main Road, Madipakkam Main Road, Pallikaranai, Chennai - 600091. There is convenient street parking and elevator access.'
    },
    {
      q: 'How does payment work?',
      a: 'You can pay at the studio via UPI, card, or cash on arrival, or choose advance online payment if requested for bulk bookings.'
    }
  ];

  return (
    <section id="faqs" className="scroll-mt-24 md:scroll-mt-28 py-20 md:py-28 bg-[#FAF7F2] border-t border-studio-border/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4 reveal-on-scroll">
          <span className="studio-badge bg-studio-coral-light text-studio-coral">
            Common Inquiries
          </span>
          <h2 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-bold text-studio-navy">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-studio-muted leading-relaxed max-w-xl mx-auto">
            Everything you need to know about preparing for your content shoot at Content Munch Studio.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3.5 reveal-on-scroll delay-100">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="studio-card overflow-hidden transition-all bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-studio-navy hover:text-studio-coral transition-colors"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <div className={`p-1 rounded-full bg-studio-cream transition-transform duration-300 ${isOpen ? 'rotate-180 bg-studio-coral text-white' : 'text-studio-muted'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-studio-charcoal/80 leading-relaxed border-t border-studio-border/40 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
