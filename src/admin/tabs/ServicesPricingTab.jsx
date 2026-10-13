import React, { useState, useEffect } from 'react';
import { Plus, Edit, CheckCircle2, AlertCircle, Trash2, DollarSign } from 'lucide-react';
import { adminGetServices, adminSaveService, adminGetAddons, adminSaveAddon, adminGetSettings, adminUpdateSettings } from '../../lib/api';

export default function ServicesPricingTab() {
  const [services, setServices] = useState([]);
  const [addons, setAddons] = useState([]);
  const [settingsList, setSettingsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Edit Service Modal
  const [editingService, setEditingService] = useState(null);
  const [svcName, setSvcName] = useState('');
  const [svcRate, setSvcRate] = useState('');
  const [svcMinDuration, setSvcMinDuration] = useState('1');
  const [svcDesc, setSvcDesc] = useState('');

  // Edit Addon Modal
  const [editingAddon, setEditingAddon] = useState(null);
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addType, setAddType] = useState('flat');
  const [addDesc, setAddDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, a, st] = await Promise.all([adminGetServices(), adminGetAddons(), adminGetSettings()]);
      setServices(s);
      setAddons(a);
      setSettingsList(st);
    } catch (err) {
      setErrorMsg('Failed to load services and pricing data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: svcName,
        base_hourly_rate: Number(svcRate),
        min_duration_hours: Number(svcMinDuration),
        description: svcDesc,
        is_active: 1
      };
      await adminSaveService(payload, editingService?.id || null);
      setEditingService(null);
      setSuccessMsg('Service pricing updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadData();
    } catch (err) {
      setErrorMsg('Failed to save service.');
    }
  };

  const handleSaveAddon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: addName,
        price: Number(addPrice),
        price_type: addType,
        description: addDesc,
        is_active: 1
      };
      await adminSaveAddon(payload, editingAddon?.id || null);
      setEditingAddon(null);
      setSuccessMsg('Add-on pricing updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadData();
    } catch (err) {
      setErrorMsg('Failed to save add-on.');
    }
  };

  const handleSettingChange = (key, val) => {
    setSettingsList(settingsList.map(s => s.key === key ? { ...s, value: val } : s));
  };

  const handleSaveSettings = async () => {
    try {
      await adminUpdateSettings(settingsList);
      setSuccessMsg('Authoritative pricing policies updated.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg('Failed to update settings.');
    }
  };

  const getSettingVal = (k) => settingsList.find(s => s.key === k)?.value || '';

  return (
    <div className="space-y-8">
      
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Global Studio Pricing Configuration */}
      <div className="bg-white rounded-3xl border border-studio-border p-6 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-editorial text-xl font-bold text-studio-navy">Authoritative Studio Pricing Policies</h3>
            <p className="text-xs text-studio-muted">Global base hourly rates, taxes, and deposit parameters</p>
          </div>
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2.5 bg-studio-navy hover:bg-studio-navy-light text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
          >
            Save Pricing Policies
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1.5 p-4 rounded-2xl bg-studio-cream border border-studio-border/70">
            <label className="font-bold uppercase text-studio-charcoal text-[11px]">Base Hourly Rate (INR ₹)</label>
            <input
              type="number"
              value={getSettingVal('base_hourly_rate')}
              onChange={(e) => handleSettingChange('base_hourly_rate', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-studio-border bg-white text-xs font-bold"
            />
            <p className="text-[11px] text-studio-muted">Baseline studio rental per hour (Default: ₹1,499).</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-studio-cream border border-studio-border/70">
            <label className="font-bold uppercase text-studio-charcoal text-[11px]">Applicable Tax (GST %)</label>
            <input
              type="number"
              value={getSettingVal('applicable_tax_percentage')}
              onChange={(e) => handleSettingChange('applicable_tax_percentage', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-studio-border bg-white text-xs font-bold"
            />
            <p className="text-[11px] text-studio-muted">Statutory GST added to bookings (Default: 18%).</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-studio-cream border border-studio-border/70">
            <label className="font-bold uppercase text-studio-charcoal text-[11px]">Advance Deposit Required (%)</label>
            <input
              type="number"
              value={getSettingVal('deposit_requirement_percentage')}
              onChange={(e) => handleSettingChange('deposit_requirement_percentage', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-studio-border bg-white text-xs font-bold"
            />
            <p className="text-[11px] text-studio-muted">0% allows pay at studio on arrival.</p>
          </div>
        </div>
      </div>

      {/* Services List Table */}
      <div className="bg-white rounded-3xl border border-studio-border p-6 shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-editorial text-xl font-bold text-studio-navy">Studio Services & Hourly Rates</h3>
            <p className="text-xs text-studio-muted">Configure rates, minimum duration, and descriptions</p>
          </div>
        </div>

        <div className="divide-y divide-studio-border/60">
          {services.map((svc) => (
            <div key={svc.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-studio-navy">{svc.name}</h4>
                  <span className="text-[10px] uppercase font-bold text-studio-muted px-2 py-0.5 rounded-full bg-studio-cream">
                    Min {svc.min_duration_hours}h
                  </span>
                </div>
                <p className="text-xs text-studio-muted mt-0.5">{svc.description}</p>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <div className="text-base font-extrabold text-studio-coral">₹{svc.base_hourly_rate}/hr</div>
                  <span className="text-[10px] text-studio-muted">+ {getSettingVal('applicable_tax_percentage')}% GST</span>
                </div>

                <button
                  onClick={() => {
                    setEditingService(svc);
                    setSvcName(svc.name);
                    setSvcRate(String(svc.base_hourly_rate));
                    setSvcMinDuration(String(svc.min_duration_hours));
                    setSvcDesc(svc.description);
                  }}
                  className="p-2 rounded-xl border border-studio-border hover:bg-studio-cream text-studio-charcoal"
                  title="Edit service rate"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add-Ons List Table */}
      <div className="bg-white rounded-3xl border border-studio-border p-6 shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-editorial text-xl font-bold text-studio-navy">Optional Production Add-Ons</h3>
            <p className="text-xs text-studio-muted">Camera operators, prompters, wireless microphones</p>
          </div>
        </div>

        <div className="divide-y divide-studio-border/60">
          {addons.map((add) => (
            <div key={add.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="flex-1">
                <h4 className="font-bold text-sm text-studio-navy">{add.name}</h4>
                <p className="text-xs text-studio-muted mt-0.5">{add.description}</p>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <div className="text-base font-extrabold text-studio-coral">₹{add.price}</div>
                  <span className="text-[10px] text-studio-muted capitalize">{add.price_type === 'per_hour' ? 'per hour' : 'flat fee'}</span>
                </div>

                <button
                  onClick={() => {
                    setEditingAddon(add);
                    setAddName(add.name);
                    setAddPrice(String(add.price));
                    setAddType(add.price_type);
                    setAddDesc(add.description);
                  }}
                  className="p-2 rounded-xl border border-studio-border hover:bg-studio-cream text-studio-charcoal"
                  title="Edit add-on rate"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-studio-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-studio-border rounded-3xl p-6 w-full max-w-md space-y-4 shadow-floating">
            <h4 className="font-editorial text-lg font-bold text-studio-navy">Edit Service: {editingService.name}</h4>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-studio-charcoal">Hourly Rate (₹ INR)</label>
                <input
                  type="number"
                  required
                  value={svcRate}
                  onChange={(e) => setSvcRate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-studio-charcoal">Minimum Duration (Hours)</label>
                <input
                  type="number"
                  required
                  step="0.5"
                  value={svcMinDuration}
                  onChange={(e) => setSvcMinDuration(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-studio-charcoal">Description</label>
                <textarea
                  rows={3}
                  value={svcDesc}
                  onChange={(e) => setSvcDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="flex-1 py-2.5 rounded-xl border border-studio-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-studio-coral text-white text-xs font-semibold uppercase tracking-wider"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Addon Modal */}
      {editingAddon && (
        <div className="fixed inset-0 z-50 bg-studio-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-studio-border rounded-3xl p-6 w-full max-w-md space-y-4 shadow-floating">
            <h4 className="font-editorial text-lg font-bold text-studio-navy">Edit Add-on: {editingAddon.name}</h4>
            <form onSubmit={handleSaveAddon} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-studio-charcoal">Price (₹ INR)</label>
                <input
                  type="number"
                  required
                  value={addPrice}
                  onChange={(e) => setAddPrice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-studio-charcoal">Price Type</label>
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream"
                >
                  <option value="flat">Flat Fee (per session)</option>
                  <option value="per_hour">Per Hour</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-studio-charcoal">Description</label>
                <textarea
                  rows={2}
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAddon(null)}
                  className="flex-1 py-2.5 rounded-xl border border-studio-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-studio-coral text-white text-xs font-semibold uppercase tracking-wider"
                >
                  Save Add-on
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
