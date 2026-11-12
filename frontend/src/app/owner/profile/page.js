'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
  Save,
  Sparkles,
  School,
  GraduationCap,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function InstitutionProfilePage() {
  const [profile, setProfile] = useState({
    name: '',
    code: '',
    type: 'SCHOOL',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    website: '',
    academicYear: '2026-2027',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/owner/profile');
        const json = await res.json();
        if (res.ok && json.data) {
          setProfile({
            name: json.data.name || '',
            code: json.data.code || '',
            type: json.data.type || 'SCHOOL',
            email: json.data.email || '',
            phone: json.data.phone || '',
            address: json.data.address || '',
            city: json.data.city || '',
            state: json.data.state || '',
            pincode: json.data.pincode || '',
            website: json.data.website || '',
            academicYear: json.data.academicYear || '2026-2027',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSaved(false);

    try {
      const res = await fetch('/api/v1/owner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      const json = await res.json();
      if (res.ok && json.status === 'success') {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setErrorMsg(json.error || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-900/30">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" /> Institution Legal Identity
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Institution Profile
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Official institutional information, board affiliations, branding, and central communication channels for your school or college.
          </p>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Institution profile updated successfully.</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span>Loading institution profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2">Institutional Identification</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Institution Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Institution Code</label>
                  <input
                    type="text"
                    disabled
                    value={profile.code}
                    className="w-full px-3 py-2.5 border rounded-xl font-mono bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Institution Type</label>
                  <input
                    type="text"
                    disabled
                    value={profile.type}
                    className="w-full px-3 py-2.5 border rounded-xl font-bold bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={profile.academicYear}
                    onChange={e => setProfile({ ...profile, academicYear: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <h3 className="text-sm font-black text-slate-900 border-b pb-2 pt-4">Contact &amp; Location</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full px-3 py-2.5 border rounded-xl font-medium bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Website</label>
                <input
                  type="text"
                  value={profile.website}
                  onChange={e => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://your-institution.edu"
                  className="w-full px-3 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Headquarters Street Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={e => setProfile({ ...profile, address: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={e => setProfile({ ...profile, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={profile.state}
                    onChange={e => setProfile({ ...profile, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={profile.pincode}
                    onChange={e => setProfile({ ...profile, pincode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
