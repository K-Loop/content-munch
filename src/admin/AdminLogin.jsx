import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, X } from 'lucide-react';
import { adminLogin } from '../lib/api';

export default function AdminLogin({ onLoginSuccess, onClose }) {
  const [email, setEmail] = useState('admin@contentmunch.com');
  const [password, setPassword] = useState('ContentMunch@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await adminLogin(email.trim(), password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
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
              Studio Staff & Director Portal
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
              Enter authorized administrator credentials to manage reservations, operating hours, and studio settings.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-studio-muted absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-studio-border bg-white text-xs text-studio-charcoal focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
                  placeholder="admin@contentmunch.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-studio-charcoal">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-studio-muted absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-studio-border bg-white text-xs text-studio-charcoal focus:ring-2 focus:ring-studio-coral focus:outline-hidden"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-studio-coral hover:bg-studio-coral-hover text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Seed hint for tester convenience */}
          <div className="p-3 bg-studio-cream border border-studio-border/70 rounded-xl text-center text-[11px] text-studio-muted">
            <span className="font-semibold text-studio-charcoal">Initial Director Credentials:</span> admin@contentmunch.com / ContentMunch@2026
          </div>

        </div>

      </div>
    </div>
  );
}
