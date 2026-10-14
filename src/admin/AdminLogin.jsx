import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, X, Info } from 'lucide-react';
import { adminLogin } from '../lib/api';

export default function AdminLogin({ onLoginSuccess, onClose }) {
  const [email, setEmail] = useState('admin@contentmunch.com');
  const [name, setName] = useState('Studio Director');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await adminLogin(email.trim() || 'admin@contentmunch.com');
      onLoginSuccess({
        name: name.trim() || 'Studio Director',
        email: email.trim() || 'admin@contentmunch.com',
        role: 'owner'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-studio-navy/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FBF9F5] border border-studio-border w-full max-w-md rounded-3xl shadow-floating overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-white border-b border-studio-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-studio-coral" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-studio-navy">
              Studio Director Portal • Frontend Demo
            </h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-studio-muted hover:text-studio-charcoal">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <h4 className="font-editorial text-2xl font-bold text-studio-navy">
              Content Munch Admin
            </h4>
            <p className="text-xs text-studio-muted">
              Explore the local studio management portal, schedule views, and client metrics.
            </p>
          </div>

          {/* Local simulation notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Frontend Simulation:</strong> This dashboard runs entirely in the browser using <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">localStorage</code>. No backend passwords or server credentials are required.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                Director / Staff Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-studio-border bg-white text-xs text-studio-charcoal focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
                placeholder="Studio Director"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-studio-muted absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-studio-border bg-white text-xs text-studio-charcoal focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
                  placeholder="admin@contentmunch.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-studio-coral hover:bg-studio-coral-hover text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Loading Dashboard...</span>
                </>
              ) : (
                <>
                  <span>Open Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-[11px] text-studio-muted">
              Local session data is preserved across refreshes in your browser.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
