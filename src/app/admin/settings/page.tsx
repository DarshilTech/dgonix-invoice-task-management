'use client';

import { useEffect, useRef, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import Image from 'next/image';
import { RegionSelect } from '@/components/ui/RegionSelect';

type Tab = 'profile' | 'company' | 'payments';

type PaymentMethod = {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
};

const emptyConfigForm = {
  companyName: '',
  companyEmail: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  logo: '',
  taxId: '',
  invoicePrefix: 'INV',
  website: '',
  fromEmail: '',
  senderName: '',
  smtpHost: '',
  smtpPort: '',
  smtpUser: '',
  smtpPass: '',
};

export default function AdminSettingsPage() {
  useDocumentTitle('Settings');
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // ── Profile tab ────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState(false);

  // ── Company config tab ─────────────────────────────────────────────────────
  const [configForm, setConfigForm] = useState(emptyConfigForm);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState('');
  const [configErr, setConfigErr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Payment methods tab ────────────────────────────────────────────────────
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodForm, setMethodForm] = useState({ name: '', description: '', isActive: true });
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [methodMsg, setMethodMsg] = useState('');
  const [methodErr, setMethodErr] = useState(false);

  // ── Auto-clear messages ────────────────────────────────────────────────────
  useEffect(() => { if (!profileMsg) return; const t = setTimeout(() => setProfileMsg(''), 4000); return () => clearTimeout(t); }, [profileMsg]);
  useEffect(() => { if (!pwMsg) return; const t = setTimeout(() => setPwMsg(''), 4000); return () => clearTimeout(t); }, [pwMsg]);
  useEffect(() => { if (!configMsg) return; const t = setTimeout(() => setConfigMsg(''), 4000); return () => clearTimeout(t); }, [configMsg]);
  useEffect(() => { if (!methodMsg) return; const t = setTimeout(() => setMethodMsg(''), 4000); return () => clearTimeout(t); }, [methodMsg]);

  // ── Load on mount + tab switch ─────────────────────────────────────────────
  useEffect(() => { fetchProfile(); }, []);
  useEffect(() => {
    if (activeTab === 'profile') fetchProfile();
    if (activeTab === 'company') fetchConfig();
    if (activeTab === 'payments') fetchMethods();
  }, [activeTab]);

  // ── Profile ────────────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    setProfileLoading(true);
    const res = await fetch('/api/users/profile', { credentials: 'include' });
    const data = await res.json();
    if (data.success) setProfile(data.data);
    setProfileLoading(false);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ firstName: profile.firstName, lastName: profile.lastName, email: profile.email }),
    });
    const data = await res.json();
    setProfileSaving(false);
    setProfileErr(!res.ok);
    setProfileMsg(res.ok ? 'Profile saved.' : data.error || 'Could not save profile');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErr(true);
      setPwMsg('New passwords do not match');
      return;
    }
    setPwSaving(true);
    const res = await fetch('/api/users/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    setPwSaving(false);
    setPwErr(!res.ok);
    setPwMsg(res.ok ? 'Password changed.' : data.error || 'Could not change password');
    if (res.ok) setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // ── Company config ─────────────────────────────────────────────────────────
  const fetchConfig = async () => {
    setConfigLoading(true);
    const res = await fetch('/api/company-config', { credentials: 'include' });
    const data = await res.json();
    if (data.success && data.data) {
      const c = data.data;
      setConfigForm({
        companyName: c.companyName || '',
        companyEmail: c.companyEmail || '',
        phone: c.phone || '',
        address: c.address || '',
        city: c.city || '',
        state: c.state || '',
        zip: c.zip || '',
        country: c.country || '',
        logo: c.logo || '',
        taxId: c.taxId || '',
        invoicePrefix: c.invoicePrefix || 'INV',
        website: c.website || '',
        fromEmail: c.fromEmail || '',
        senderName: c.senderName || '',
        smtpHost: c.smtpHost || '',
        smtpPort: c.smtpPort?.toString() || '',
        smtpUser: c.smtpUser || '',
        smtpPass: c.smtpPass || '',
      });
    }
    setConfigLoading(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setConfigErr(true);
      setConfigMsg('Image must be under 5 MB');
      return;
    }
    setConfigMsg('Uploading logo…');
    setConfigErr(false);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'logos');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json();
      if (!res.ok) { setConfigErr(true); setConfigMsg(data.error || 'Logo upload failed'); return; }
      setConfigForm((prev) => ({ ...prev, logo: data.data.url }));
      setConfigMsg('Logo uploaded. Save configuration to apply.');
    } catch {
      setConfigErr(true);
      setConfigMsg('Logo upload failed');
    }
  };

  const handleConfigSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(configForm)) {
      if (v !== '') payload[k] = v;
    }
    if (payload.smtpPort) payload.smtpPort = Number(payload.smtpPort);
    const res = await fetch('/api/company-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setConfigSaving(false);
    setConfigErr(!res.ok);
    setConfigMsg(res.ok ? 'Configuration saved.' : data.error || 'Could not save configuration');
  };

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfigForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Payment methods ────────────────────────────────────────────────────────
  const fetchMethods = async () => {
    const res = await fetch('/api/payment-methods?includeDisabled=true', { credentials: 'include' });
    const data = await res.json();
    if (data.success) setMethods(data.data || []);
  };

  const submitPaymentMethod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = editingMethod ? `/api/payment-methods/${editingMethod._id}` : '/api/payment-methods';
    const method = editingMethod ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(methodForm),
    });
    const data = await res.json();
    setMethodErr(!res.ok);
    setMethodMsg(res.ok ? (editingMethod ? 'Payment method updated' : 'Payment method added') : data.error || 'Could not save');
    if (res.ok) { setEditingMethod(null); setMethodForm({ name: '', description: '', isActive: true }); fetchMethods(); }
  };

  const editMethod = (m: PaymentMethod) => {
    setEditingMethod(m);
    setMethodForm({ name: m.name, description: m.description || '', isActive: m.isActive });
  };

  const disableMethod = async (id: string) => {
    if (!window.confirm('Disable this payment method?')) return;
    const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE', credentials: 'include' });
    setMethodErr(!res.ok);
    setMethodMsg(res.ok ? 'Payment method disabled' : 'Could not disable payment method');
    if (res.ok) fetchMethods();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Admin Profile' },
    { id: 'company', label: 'Company' },
    { id: 'payments', label: 'Payment Methods' },
  ];

  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle">Manage your profile, company configuration, and preferences</p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Admin Profile ──────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-6 py-6">
          {profileLoading ? (
            <div className="card"><div className="card-body text-center text-gray-500">Loading...</div></div>
          ) : (
            <>
              {profileMsg && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${profileErr ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{profileMsg}</div>
              )}
              <div className="card">
                <div className="card-header"><h2 className="font-semibold">Personal Information</h2></div>
                <form onSubmit={handleProfileSave} className="card-body grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">First Name</label>
                    <input name="firstName" className="input" value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} required autoComplete="given-name" />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input name="lastName" className="input" value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} autoComplete="family-name" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Email</label>
                    <input type="email" name="email" className="input" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} required autoComplete="email" />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button type="submit" className="btn btn-primary" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save Profile'}</button>
                  </div>
                </form>
              </div>

              {pwMsg && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${pwErr ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{pwMsg}</div>
              )}
              <div className="card">
                <div className="card-header"><h2 className="font-semibold">Change Password</h2></div>
                <form onSubmit={handlePasswordChange} className="card-body grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="label">Current Password</label>
                    <input type="password" name="currentPassword" className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} required autoComplete="current-password" />
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <input type="password" name="newPassword" className="input" value={pwForm.newPassword} onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} required minLength={8} autoComplete="new-password" />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input type="password" name="confirmPassword" className="input" value={pwForm.confirmPassword} onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))} required autoComplete="new-password" />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button type="submit" className="btn btn-primary" disabled={pwSaving}>{pwSaving ? 'Changing...' : 'Change Password'}</button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Company Configuration ──────────────────────────────────────────── */}
      {activeTab === 'company' && (
        <div className="space-y-6 py-6">
          {configLoading ? (
            <div className="card"><div className="card-body text-center text-gray-500">Loading...</div></div>
          ) : (
            <>
              {configMsg && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${configErr ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{configMsg}</div>
              )}
              <form onSubmit={handleConfigSave} className="space-y-6">

                {/* Logo */}
                <div className="card">
                  <div className="card-header"><h2 className="font-semibold">Company Logo</h2></div>
                  <div className="card-body flex items-center gap-6">
                    {configForm.logo ? (
                      <Image src={configForm.logo} alt="Logo" width={80} height={80} className="h-20 w-20 rounded-lg border border-gray-200 object-contain" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">No logo</div>
                    )}
                    <div>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => fileInputRef.current?.click()}>Upload Logo</button>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG or SVG — max 1 MB</p>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </div>
                  </div>
                </div>

                {/* Business details */}
                <div className="card">
                  <div className="card-header"><h2 className="font-semibold">Business Details</h2></div>
                  <div className="card-body grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Company Name</label>
                      <input name="companyName" className="input" value={configForm.companyName} onChange={setField('companyName')} placeholder="Your Company Ltd." />
                    </div>
                    <div>
                      <label className="label">Company Email</label>
                      <input type="email" name="companyEmail" className="input" value={configForm.companyEmail} onChange={setField('companyEmail')} placeholder="contact@yourcompany.com" />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input name="phone" className="input" value={configForm.phone} onChange={setField('phone')} placeholder="+1 555 000 0000" />
                    </div>
                    <div>
                      <label className="label">Website</label>
                      <input type="url" name="website" className="input" value={configForm.website} onChange={setField('website')} placeholder="https://yourcompany.com" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Street Address</label>
                      <input name="address" className="input" value={configForm.address} onChange={setField('address')} />
                    </div>
                    <div>
                      <label className="label">City</label>
                      <input name="city" className="input" value={configForm.city} onChange={setField('city')} />
                    </div>
                    <div>
                      <label className="label">Zip / Postal Code</label>
                      <input name="zip" className="input" value={configForm.zip} onChange={setField('zip')} />
                    </div>
                    <RegionSelect
                      country={configForm.country}
                      state={configForm.state}
                      onCountryChange={(v) => setConfigForm((p) => ({ ...p, country: v, state: '' }))}
                      onStateChange={(v) => setConfigForm((p) => ({ ...p, state: v }))}
                    />
                    <div>
                      <label className="label">GST / Tax ID</label>
                      <input name="taxId" className="input" value={configForm.taxId} onChange={setField('taxId')} />
                    </div>
                    <div>
                      <label className="label">Invoice Prefix</label>
                      <input name="invoicePrefix" className="input" value={configForm.invoicePrefix} onChange={setField('invoicePrefix')} placeholder="INV" />
                    </div>
                  </div>
                </div>

                {/* SMTP */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="font-semibold">Email / SMTP Configuration</h2>
                    <p className="mt-1 text-xs text-gray-500">Used to send invoices from your own email address</p>
                  </div>
                  <div className="card-body grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">From Email</label>
                      <input type="email" name="fromEmail" className="input" value={configForm.fromEmail} onChange={setField('fromEmail')} placeholder="invoices@yourcompany.com" />
                    </div>
                    <div>
                      <label className="label">Sender Name</label>
                      <input name="senderName" className="input" value={configForm.senderName} onChange={setField('senderName')} placeholder="Invoxa by Dgonix" />
                      <p className="mt-1 text-xs text-gray-500">Shown as the sender in the recipient's inbox</p>
                    </div>
                    <div>
                      <label className="label">SMTP Host</label>
                      <input name="smtpHost" className="input" value={configForm.smtpHost} onChange={setField('smtpHost')} placeholder="smtp.gmail.com" />
                    </div>
                    <div>
                      <label className="label">SMTP Port</label>
                      <input type="number" name="smtpPort" className="input" value={configForm.smtpPort} onChange={setField('smtpPort')} placeholder="587" />
                    </div>
                    <div>
                      <label className="label">SMTP Username</label>
                      <input name="smtpUser" className="input" value={configForm.smtpUser} onChange={setField('smtpUser')} />
                    </div>
                    <div>
                      <label className="label">SMTP Password</label>
                      <input type="password" name="smtpPass" className="input" value={configForm.smtpPass} onChange={setField('smtpPass')} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="btn btn-primary" disabled={configSaving}>
                    {configSaving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {/* ── Payment Methods ────────────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="space-y-6 py-6">
          {methodMsg && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${methodErr ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{methodMsg}</div>
          )}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">Payment Methods</h2>
              <p className="mt-1 text-xs text-gray-500">Methods available when recording payments on invoices</p>
            </div>
            <form onSubmit={submitPaymentMethod} className="card-body space-y-4">
              <div>
                <label className="label">Name</label>
                <input name="name" className="input" value={methodForm.name} onChange={(e) => setMethodForm((p) => ({ ...p, name: e.target.value }))} placeholder="Bank Transfer" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" value={methodForm.description} onChange={(e) => setMethodForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={methodForm.isActive} onChange={(e) => setMethodForm((p) => ({ ...p, isActive: e.target.checked }))} />
                Active
              </label>
              <div className="flex gap-3">
                <button className="btn btn-primary" type="submit">{editingMethod ? 'Save Changes' : 'Add Method'}</button>
                {editingMethod && (
                  <button className="btn btn-secondary" type="button" onClick={() => { setEditingMethod(null); setMethodForm({ name: '', description: '', isActive: true }); }}>Cancel</button>
                )}
              </div>
            </form>
            <div className="border-t border-gray-200">
              {methods.map((m) => (
                <div className="flex items-center justify-between gap-4 px-6 py-4" key={m._id}>
                  <div>
                    <p className="font-medium">{m.name}</p>
                    {m.description && <p className="text-sm text-gray-500">{m.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${m.isActive ? 'text-green-700' : 'text-gray-400'}`}>{m.isActive ? 'Active' : 'Disabled'}</span>
                    <button className="text-sm text-blue-700 hover:underline" onClick={() => editMethod(m)} type="button">Edit</button>
                    <button className="text-sm text-red-700 hover:underline" onClick={() => disableMethod(m._id)} type="button">Disable</button>
                  </div>
                </div>
              ))}
              {methods.length === 0 && <div className="px-6 py-8 text-center text-sm text-gray-500">No payment methods yet</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
