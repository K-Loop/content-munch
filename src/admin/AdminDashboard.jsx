import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar, CalendarDays, Clock, DollarSign, 
  Users, BarChart3, LogOut, ExternalLink, ShieldCheck, UserCheck, Menu, X
} from 'lucide-react';
import { adminGetMetrics, setAdminToken } from '../lib/api';
import OverviewTab from './tabs/OverviewTab';
import BookingsTab from './tabs/BookingsTab';
import CalendarTab from './tabs/CalendarTab';
import OperatingHoursTab from './tabs/OperatingHoursTab';
import ServicesPricingTab from './tabs/ServicesPricingTab';
import StaffTab from './tabs/StaffTab';
import CustomersTab from './tabs/CustomersTab';
import ReportsTab from './tabs/ReportsTab';

export default function AdminDashboard({ adminUser, onLogout, onExitToPublic }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await adminGetMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings Manager', icon: CalendarDays },
    { id: 'calendar', label: 'Studio Calendar', icon: Calendar },
    { id: 'hours', label: 'Operating Hours', icon: Clock },
    { id: 'pricing', label: 'Services & Pricing', icon: DollarSign },
    { id: 'staff', label: 'Staff & Operators', icon: UserCheck },
    { id: 'customers', label: 'Creator Directory', icon: Users },
    { id: 'reports', label: 'Reports & Audit', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-studio-charcoal flex flex-col md:flex-row">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 bg-studio-navy text-white flex-col justify-between shrink-0 border-r border-studio-navy-dark">
        <div>
          {/* Logo / Header */}
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-studio-coral text-white flex items-center justify-center font-bold text-xs shadow-xs">
              CM
            </div>
            <div>
              <h2 className="font-editorial text-base font-bold leading-tight">Content Munch</h2>
              <span className="text-[10px] text-white/60 uppercase tracking-widest block -mt-0.5">Admin Management</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-studio-coral text-white shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">{adminUser?.name || 'Director'}</span>
              <span className="text-[10px] text-studio-coral uppercase font-bold tracking-wider">{adminUser?.role || 'owner'}</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onExitToPublic}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[11px] font-semibold transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-studio-navy text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-studio-coral text-white flex items-center justify-center font-bold text-xs">
            CM
          </div>
          <span className="font-editorial text-sm font-bold">Admin Portal</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-white/80 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-studio-navy text-white p-4 space-y-2 border-b border-white/10 animate-in fade-in duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                  isActive ? 'bg-studio-coral text-white' : 'text-white/70'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-3 border-t border-white/10 flex gap-2">
            <button
              onClick={onExitToPublic}
              className="flex-1 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold"
            >
              Back to Public Site
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {activeTab === 'overview' && (
            <OverviewTab
              metrics={metrics}
              onTabChange={setActiveTab}
              onOpenManualBooking={() => setActiveTab('bookings')}
            />
          )}

          {activeTab === 'bookings' && <BookingsTab />}
          {activeTab === 'calendar' && <CalendarTab />}
          {activeTab === 'hours' && <OperatingHoursTab />}
          {activeTab === 'pricing' && <ServicesPricingTab />}
          {activeTab === 'staff' && <StaffTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'reports' && <ReportsTab />}
        </div>
      </main>

    </div>
  );
}
