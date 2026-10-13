import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StudioIntro from './components/StudioIntro';
import Services from './components/Services';
import Facilities from './components/Facilities';
import Gallery from './components/Gallery';
import Pricing from './components/Pricing';
import FaqSection from './components/FaqSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import BookingEngine from './components/BookingEngine';
import BookingLookupModal from './components/BookingLookupModal';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import { fetchStudioConfig, adminGetMe, setAdminToken } from './lib/api';
import { useScrollReveal } from './lib/useAnimations';

export default function App() {
  const [config, setConfig] = useState({ services: [], addons: [], settings: {}, operatingHours: [] });
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  // Connect scroll reveal observer across main content sections
  const mainContentRef = useScrollReveal({}, [config.services.length, config.addons.length]);

  // Modals & Navigation
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);

  // Admin Auth State
  const [currentView, setCurrentView] = useState('public'); // 'public' | 'admin'
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    loadConfig();
    checkExistingAdminSession();

    // Check if initial hash is #admin
    if (window.location.hash === '#admin') {
      setCurrentView('admin');
    }
  }, []);

  const loadConfig = async () => {
    try {
      const data = await fetchStudioConfig();
      setConfig(data);
    } catch (err) {
      console.error('Failed to load studio configuration:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const checkExistingAdminSession = async () => {
    try {
      const token = localStorage.getItem('cm_admin_token');
      if (token) {
        const data = await adminGetMe();
        if (data.user) {
          setAdminUser(data.user);
        }
      }
    } catch (err) {
      setAdminToken(null);
      setAdminUser(null);
    }
  };

  const handleOpenBooking = (service = null) => {
    setSelectedServiceForBooking(service);
    setBookingModalOpen(true);
  };

  const handleAdminLoginSuccess = (user) => {
    setAdminUser(user);
    setAdminLoginOpen(false);
    setCurrentView('admin');
    window.location.hash = '#admin';
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    setCurrentView('public');
    window.location.hash = '';
  };

  // If in admin view
  if (currentView === 'admin') {
    if (!adminUser) {
      return (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onClose={() => {
            setCurrentView('public');
            window.location.hash = '';
          }}
        />
      );
    }
    return (
      <AdminDashboard
        adminUser={adminUser}
        onLogout={handleAdminLogout}
        onExitToPublic={() => {
          setCurrentView('public');
          window.location.hash = '';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-studio-charcoal selection:bg-studio-coral selection:text-white">
      
      {/* Sticky Editorial Navbar */}
      <Navbar
        onOpenBooking={() => handleOpenBooking(null)}
        onOpenAdmin={() => {
          if (adminUser) {
            setCurrentView('admin');
            window.location.hash = '#admin';
          } else {
            setAdminLoginOpen(true);
          }
        }}
        onOpenLookup={() => setLookupModalOpen(true)}
      />

      <main ref={mainContentRef}>
        {/* Photography-Led Hero */}
        <Hero onOpenBooking={() => handleOpenBooking(null)} />

        {/* Studio Introduction & Audiences */}
        <StudioIntro onOpenBooking={() => handleOpenBooking(null)} />

        {/* Studio Services */}
        <Services
          services={config.services}
          onSelectService={(service) => handleOpenBooking(service)}
        />

        {/* Facilities & Amenities */}
        <Facilities />

        {/* Photo Gallery & Lightbox */}
        <Gallery />

        {/* Dynamic Authoritative Pricing */}
        <Pricing
          services={config.services}
          addons={config.addons}
          settings={config.settings}
          onOpenBookingWithService={(service) => handleOpenBooking(service)}
        />

        {/* Frequently Asked Questions */}
        <FaqSection settings={config.settings} />

        {/* Verified Contact & Directions */}
        <ContactSection settings={config.settings} />
      </main>

      {/* Editorial Footer */}
      <Footer
        onOpenAdmin={() => {
          if (adminUser) {
            setCurrentView('admin');
            window.location.hash = '#admin';
          } else {
            setAdminLoginOpen(true);
          }
        }}
        onOpenBooking={() => handleOpenBooking(null)}
        onOpenLookup={() => setLookupModalOpen(true)}
      />

      {/* 8-Step Interactive Booking Engine Modal */}
      <BookingEngine
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedServiceForBooking(null);
        }}
        services={config.services}
        addons={config.addons}
        settings={config.settings}
        initialService={selectedServiceForBooking}
      />

      {/* Booking Lookup Modal */}
      <BookingLookupModal
        isOpen={lookupModalOpen}
        onClose={() => setLookupModalOpen(false)}
      />

      {/* Admin Login Modal */}
      {adminLoginOpen && (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onClose={() => setAdminLoginOpen(false)}
        />
      )}

    </div>
  );
}
