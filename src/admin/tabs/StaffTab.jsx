import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, CheckCircle2, AlertCircle, Edit, Mail, Phone, Trash2 } from 'lucide-react';
import { adminGetStaff, adminSaveStaff, adminDeleteStaff } from '../../lib/api';

export default function StaffTab() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('operator');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await adminGetStaff();
      setStaffList(data);
    } catch (err) {
      setErrorMsg('Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await adminSaveStaff({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role
      }, editingStaff?.id || null);

      setModalOpen(false);
      setEditingStaff(null);
      setName('');
      setEmail('');
      setPhone('');
      setSuccessMsg('Staff member saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadStaff();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save staff member');
    }
  };

  const handleDeleteStaff = async (id, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from local staff?`)) {
      return;
    }
    try {
      await adminDeleteStaff(id);
      setSuccessMsg('Staff member removed successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadStaff();
    } catch (err) {
      setErrorMsg('Failed to delete staff member.');
    }
  };

  return (
    <div className="space-y-6">
      
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

      {/* Header */}
      <div className="bg-white rounded-2xl border border-studio-border p-4 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="font-editorial text-lg font-bold text-studio-navy">Studio Staff & Camera Operators</h3>
          <p className="text-xs text-studio-muted">Manage locally defined team members for shoot coordination</p>
        </div>

        <button
          onClick={() => {
            setEditingStaff(null);
            setName('');
            setEmail('');
            setPhone('');
            setRole('operator');
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-studio-coral hover:bg-studio-coral-hover text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Grid or Empty State */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-studio-coral border-t-transparent animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-studio-muted">Loading staff records...</p>
        </div>
      ) : staffList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {staffList.map((member) => (
            <div key={member.id} className="bg-white rounded-2xl border border-studio-border p-5 shadow-soft space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base text-studio-navy">{member.name}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-studio-cream text-studio-coral">
                    {member.role}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingStaff(member);
                      setName(member.name);
                      setEmail(member.email);
                      setPhone(member.phone || '');
                      setRole(member.role);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-studio-border hover:bg-studio-cream text-studio-muted hover:text-studio-charcoal"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(member.id, member.name)}
                    className="p-1.5 rounded-lg border border-studio-border hover:bg-red-50 text-studio-muted hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-studio-charcoal">
                <div className="flex items-center gap-2 text-studio-muted">
                  <Mail className="w-3.5 h-3.5 text-studio-coral shrink-0" />
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-studio-muted">
                    <Phone className="w-3.5 h-3.5 text-studio-coral shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-studio-border p-12 text-center space-y-4 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-studio-cream text-studio-coral flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-editorial text-lg font-bold text-studio-navy">No Staff Members Added Yet</h4>
            <p className="text-xs text-studio-muted max-w-sm mx-auto mt-1">
              Your staff directory starts clean and empty. Add team members or camera operators locally to assign them to bookings.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingStaff(null);
              setName('');
              setEmail('');
              setPhone('');
              setRole('operator');
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-studio-coral hover:bg-studio-coral-hover text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Staff Member</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-studio-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-studio-border rounded-3xl p-6 w-full max-w-md space-y-4 shadow-floating">
            <h4 className="font-editorial text-lg font-bold text-studio-navy">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-studio-charcoal">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream"
                  placeholder="e.g. Sathish Kumar"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-studio-charcoal">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream"
                  placeholder="e.g. sathish@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-studio-charcoal">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream"
                  placeholder="+91 94896 80339"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-studio-charcoal">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-studio-border text-xs bg-studio-cream font-semibold"
                >
                  <option value="operator">Studio Operator</option>
                  <option value="manager">Studio Floor Manager</option>
                  <option value="support">Technical Support</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-studio-border text-xs font-semibold hover:bg-studio-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-studio-coral text-white text-xs font-semibold uppercase tracking-wider hover:bg-studio-coral-hover"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
