import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function ContactSection({ settings = {} }) {
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const phone = settings.contact_phone || '+919489680339';
  const email = settings.contact_email || 'Socialangadi@gmail.com';
  const address = settings.contact_address || '45, Plot 3, FIRST FLOOR, Velachery Main Road, Madipakkam Main Road, Pallikaranai, Chennai-600091';
  const whatsappNumber = settings.whatsapp_number || '919489680339';

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!inquiryName || !inquiryPhone) return;
    
    // Construct WhatsApp message with inquiry details
    const text = encodeURIComponent(
      `Hello Content Munch Studio!\nName: ${inquiryName}\nPhone: ${inquiryPhone}\nMessage: ${inquiryMsg || 'Inquiring about studio rental availability.'}`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
    setSentSuccess(true);
  };

  return (
    <section id="contact" className="scroll-mt-24 md:scroll-mt-28 py-20 md:py-28 bg-white border-t border-studio-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 reveal-on-scroll">
          <span className="studio-badge bg-studio-coral-light text-studio-coral">
            Visit & Connect
          </span>
          <h2 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-bold text-studio-navy">
            Find Content Munch Studio in Chennai
          </h2>
          <p className="text-base text-studio-muted leading-relaxed">
            Have questions about equipment compatibility, bulk shoot rates, or custom set dressing? Reach out to our studio team directly.
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Details */}
          <div className="lg:col-span-5 space-y-6 reveal-on-scroll delay-100">
            
            {/* Phone */}
            <div className="p-6 rounded-2xl bg-studio-cream border border-studio-border/80 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-studio-navy text-white flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-studio-coral" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-studio-muted">Call Directly</span>
                <div className="text-base font-bold text-studio-navy mt-0.5">
                  <a href={`tel:${phone}`} className="hover:text-studio-coral transition-colors">{phone}</a>
                </div>
                <p className="text-xs text-studio-muted mt-1">Available 09:00 AM – 09:00 PM for booking queries.</p>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">WhatsApp Chat</span>
                <div className="text-base font-bold text-emerald-950 mt-0.5">
                  <a 
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi Content Munch Studio, I would like to inquire about booking a slot')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1.5"
                  >
                    <span>Instant WhatsApp Inquiry</span>
                  </a>
                </div>
                <p className="text-xs text-emerald-700/80 mt-1">Direct coordination with our studio floor manager.</p>
              </div>
            </div>

            {/* Email */}
            <div className="p-6 rounded-2xl bg-studio-cream border border-studio-border/80 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-studio-navy text-white flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-studio-coral" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-studio-muted">Email Studio</span>
                <div className="text-base font-bold text-studio-navy mt-0.5">
                  <a href={`mailto:${email}`} className="hover:text-studio-coral transition-colors">{email}</a>
                </div>
                <p className="text-xs text-studio-muted mt-1">Invoices, commercial contracts, and agency partnerships.</p>
              </div>
            </div>

            {/* Physical Location */}
            <div className="p-6 rounded-2xl bg-studio-cream border border-studio-border/80 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-studio-navy text-white flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-studio-coral" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-studio-muted">Studio Address</span>
                <p className="text-xs font-semibold text-studio-navy mt-0.5 leading-relaxed">
                  {address}
                </p>
                <div className="mt-2">
                  <a
                    href="https://maps.google.com/?q=Content+Munch+Studio+Pallikaranai+Chennai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-studio-coral hover:underline"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right Inquiry Form */}
          <div className="lg:col-span-7 bg-[#FAF7F2] border border-studio-border rounded-3xl p-8 sm:p-10 shadow-soft reveal-on-scroll delay-150">
            <h3 className="text-2xl font-bold font-editorial text-studio-navy mb-2">
              Send a Studio Inquiry
            </h3>
            <p className="text-xs text-studio-muted mb-6">
              Need custom arrangements or have questions before booking? Fill out this quick form.
            </p>

            {sentSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900">Inquiry Launched!</h4>
                <p className="text-xs text-emerald-700">
                  We've opened WhatsApp with your details. Our studio director will follow up with you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anand Kumar"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-studio-border bg-white text-xs text-studio-charcoal focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 94896 80339"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      className="w-full p-3 rounded-xl border border-studio-border bg-white text-xs text-studio-charcoal focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                    Shoot Requirements & Questions
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your production date, camera gear needs, or specific backdrop requirements..."
                    value={inquiryMsg}
                    onChange={(e) => setInquiryMsg(e.target.value)}
                    className="w-full p-3 rounded-xl border border-studio-border bg-white text-xs text-studio-charcoal focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-studio-navy hover:bg-studio-navy-light text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Inquiry via WhatsApp</span>
                </button>
              </form>
            )}

            {/* Operating Hours Summary */}
            <div className="mt-8 pt-6 border-t border-studio-border/60 flex items-center gap-3 text-xs text-studio-muted">
              <Clock className="w-4 h-4 text-studio-coral shrink-0" />
              <span>Operating Hours: Monday – Saturday (09:00 AM – 09:00 PM) • Sunday (10:00 AM – 07:00 PM IST)</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
