'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Building2,
  School,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  CreditCard,
  User,
  Mail,
  Phone,
  Lock,
  Globe,
  MapPin,
  Calendar,
  Layers,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export default function CreateInstitutionPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    // Institution Details
    name: '',
    type: 'SCHOOL',
    logoUrl: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Academic & Campus Details
    academicYear: '2026-2027',
    numberOfBranches: 1,

    // Subscription & Status
    planId: '',
    trialPeriodDays: 14,
    status: 'ACTIVE',

    // Primary Institutional Owner
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: ''
  });

  const [plans, setPlans] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/v1/owner/subscriptions')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.plans && data.plans.length > 0) {
          setPlans(data.plans);
          setFormData(prev => ({ ...prev, planId: data.plans[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/owner/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success || data.status === 'success') {
        setSuccessResult(data.data || {
          tenant: data.institution,
          owner: data.institution?.owner,
          invitation: data.institution?.invitation
        });
      } else {
        setErrorMsg(data.error || 'Failed to onboard institution.');
      }
    } catch (err) {
      setErrorMsg('Network error occurred during onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!successResult) return;
    const text = `=== Onboarded Institution Credentials ===\nName: ${successResult.tenant.name}\nTenant ID: ${successResult.tenant.id}\nCode: ${successResult.tenant.code}\nOwner: ${successResult.owner.email}\nTemp Password: ${formData.ownerPassword || '[Secret]'}\nActivation Link: ${successResult.invitation?.activationLink || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <DashboardLayout role="owner">
      <div className="max-w-5xl mx-auto space-y-6 pb-16">
        {/* Back Link & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/owner/institutions"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Institutions</span>
          </Link>
          <span className="text-xs text-slate-400 font-medium">Tenant Provisioning Wizard</span>
        </div>

        {/* Title Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Institution Onboarding & Provisioning
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Add New School or College
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Register a new educational entity on the platform. This will create an isolated tenant database partition, establish branch campuses, initialize default academic structures, configure subscriptions, and generate the primary Institutional Owner login.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SUCCESS RECEIPT MODAL / OVERLAY */}
        {successResult && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/30 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Institution Successfully Provisioned!</h2>
                  <p className="text-xs text-slate-500">Tenant workspace is isolated and active.</p>
                </div>
              </div>

              <button
                onClick={copyCredentials}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Institution Metadata</span>
                <div className="text-base font-black text-slate-900">{successResult.tenant.name}</div>
                <div className="font-mono text-xs text-indigo-600">Tenant ID: {successResult.tenant.id}</div>
                <div className="font-mono text-xs text-slate-600">Unique Code: {successResult.tenant.code}</div>
                <div className="text-xs text-slate-700">Type: <span className="font-bold">{successResult.tenant.type}</span></div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">Primary Owner Account</span>
                <div className="text-base font-black text-indigo-950">{successResult.owner.name}</div>
                <div className="text-xs font-semibold text-indigo-800">Email: {successResult.owner.email}</div>
                <div className="text-xs font-mono bg-white/80 p-2 rounded-lg border border-indigo-200">
                  Password: {formData.ownerPassword || '[Pre-configured]'}
                </div>
              </div>
            </div>

            {successResult.invitation?.activationLink && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <span className="font-extrabold block mb-1">Owner Activation / Password Reset Link:</span>
                <span className="font-mono text-[11px] select-all break-all text-amber-800 bg-white/70 p-2 rounded block border border-amber-200">
                  {successResult.invitation.activationLink}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/owner/institutions"
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-md"
              >
                Go to All Institutions Directory
              </Link>
            </div>
          </div>
        )}

        {/* ONBOARDING FORM */}
        {!successResult && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic Information */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">1. Institution Profile</h2>
                  <p className="text-xs text-slate-500">Legal identity and core organizational attributes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5">Institution Full Legal Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Greenwood International School or Springfield College of Science"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Institution Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, type: 'SCHOOL' }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        formData.type === 'SCHOOL'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <School className="w-4 h-4" />
                      <span>School (K-12)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, type: 'COLLEGE' }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        formData.type === 'COLLEGE'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>College / Uni</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Logo URL (Optional)</label>
                  <input
                    type="url"
                    name="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Official Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="admissions@school.edu"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Contact Number *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5">Website URL</label>
                  <input
                    type="text"
                    name="website"
                    placeholder="https://www.myschool.edu"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Campus Location & Branches */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">2. Physical Location & Branches</h2>
                  <p className="text-xs text-slate-500">Primary campus address and multi-branch infrastructure</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1.5">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="e.g. 42 Knowledge Boulevard, Sector 15"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="Mumbai / Delhi / Bengaluru"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">State *</label>
                  <input
                    type="text"
                    name="state"
                    required
                    placeholder="Maharashtra"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">PIN Code *</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    placeholder="400001"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Academic Session *</label>
                  <input
                    type="text"
                    name="academicYear"
                    required
                    placeholder="2026-2027"
                    value={formData.academicYear}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Number of Initial Branches</label>
                  <input
                    type="number"
                    name="numberOfBranches"
                    min="1"
                    max="10"
                    value={formData.numberOfBranches}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Initial Account Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Immediate Access)</option>
                    <option value="TRIAL">TRIAL (Evaluation Window)</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Subscription & Licensing */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">3. SaaS Subscription Plan & Tier</h2>
                  <p className="text-xs text-slate-500">Billing tier and feature entitlements</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((p) => {
                  const isSelected = formData.planId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setFormData(prev => ({ ...prev, planId: p.id }))}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-600">{p.tier}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <div className="text-lg font-black text-slate-900 mt-1">{p.name}</div>
                        <div className="text-xl font-black text-slate-900 mt-2">
                          ₹{Number(p.price).toLocaleString()}
                          <span className="text-xs text-slate-500 font-normal"> / {p.billingCycle.toLowerCase()}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                        <div>&bull; Max Students: <strong>{p.maxStudents}</strong></div>
                        <div>&bull; Max Staff: <strong>{p.maxStaff}</strong></div>
                        <div>&bull; Max Campuses: <strong>{p.maxCampuses}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Trial Period (Days)</label>
                  <input
                    type="number"
                    name="trialPeriodDays"
                    min="0"
                    max="90"
                    value={formData.trialPeriodDays}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Primary Institutional Owner Account */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">4. First Institutional Owner (Admin Account)</h2>
                  <p className="text-xs text-slate-500">Initial user account with complete administrative control over this institution</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    name="ownerFirstName"
                    required
                    placeholder="e.g. Ramesh / Sarah"
                    value={formData.ownerFirstName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    name="ownerLastName"
                    required
                    placeholder="e.g. Sharma / Jenkins"
                    value={formData.ownerLastName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Owner Login Email *</label>
                  <input
                    type="email"
                    name="ownerEmail"
                    required
                    placeholder="principal@school.edu"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Owner Phone Number</label>
                  <input
                    type="text"
                    name="ownerPhone"
                    placeholder="+91 98765 12345"
                    value={formData.ownerPhone}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5">Initial Account Password *</label>
                  <input
                    type="password"
                    name="ownerPassword"
                    required
                    placeholder="Minimum 6 characters (e.g. AdminPass@2026)"
                    value={formData.ownerPassword}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">An invitation link will also be generated allowing them to reset this password upon initial login.</p>
                </div>
              </div>
            </div>

            {/* Submission Bar */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/owner/institutions"
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Provisioning Isolated Tenant...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Provision & Launch Institution</span>
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
