import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar, CalendarDays, Clock, DollarSign, 
  Users, BarChart3, LogOut, ExternalLink, ShieldCheck, UserCheck, Menu, X, RotateCcw, AlertTriangle
} from 'lucide-react';
import { adminGetMetrics, resetLocalDemoData } from '../lib/api';
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
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

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

  const handleConfirmReset = async () => {
    await resetLocalDemoData();
    setResetModalOpen(false);
    setResetSuccess(true);
    await loadMetrics();
    setTimeout(() => setResetSuccess(false), 3500);
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

        {/* Footer / User Profile & Actions */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">{adminUser?.name || 'Director'}</span>
              <span className="text-[10px] text-studio-coral uppercase font-bold tracking-wider">{adminUser?.role || 'owner'}</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => setResetModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer border border-white/10"
            title="Wipe local bookings and restore empty state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Local Data</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onExitToPublic}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[11px] font-semibold transition-colors cursor-pointer"
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
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setResetModalOpen(true);
              }}
              className="w-full py-2 rounded-lg bg-white/5 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Local Demo Data</span>
            </button>
            <div className="flex gap-2">
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
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Simulation & Reset feedback banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span><strong>100% Frontend Mode:</strong> Running entirely in this browser. Bookings, customers, and schedules are saved to localStorage.</span>
            </div>
            <button
              onClick={() => setResetModalOpen(true)}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline shrink-0 ml-2 cursor-pointer"
            >
              Reset Data
            </button>
          </div>

          {resetSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium animate-in fade-in">
              Local database restored to clean initial empty state. All test records cleared.
            </div>
          )}

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

      {/* Confirmation Dialog for Resetting Local Data */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-studio-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-studio-border rounded-3xl p-6 w-full max-w-md space-y-4 shadow-floating">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-editorial text-xl font-bold text-studio-navy">
              Reset Local Storage Data?
            </h4>
            <p className="text-xs text-studio-muted leading-relaxed">
              This will wipe all locally created bookings, custom staff members, and blocked dates from your browser's localStorage, returning the studio to its clean, initial empty state.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-studio-border text-xs font-semibold hover:bg-studio-cream cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
