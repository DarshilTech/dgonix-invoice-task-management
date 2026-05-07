'use client';

import { useEffect, useState } from 'react';
import { RegionSelect } from '@/components/ui/RegionSelect';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

type Company = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  logo?: string;
  isActive: boolean;
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: '',
};

function getActiveTenantId(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)activeTenant=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function CompanyForm({
  form,
  onChange,
  onCountryChange,
  onStateChange,
}: {
  form: typeof emptyForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="label">Company Name *</label>
        <input name="name" className="input" value={form.name} onChange={onChange} required />
      </div>
      <div>
        <label className="label">Company Email *</label>
        <input name="email" type="email" className="input" value={form.email} onChange={onChange} required />
      </div>
      <div>
        <label className="label">Phone</label>
        <input name="phone" className="input" value={form.phone} onChange={onChange} />
      </div>
      <div className="md:col-span-2">
        <label className="label">Address</label>
        <input name="address" className="input" value={form.address} onChange={onChange} />
      </div>
      <div>
        <label className="label">City</label>
        <input name="city" className="input" value={form.city} onChange={onChange} />
      </div>
      <RegionSelect
        country={form.country}
        state={form.state}
        onCountryChange={onCountryChange}
        onStateChange={onStateChange}
      />
      <div>
        <label className="label">Zip / Postal Code</label>
        <input name="zip" className="input" value={form.zip} onChange={onChange} />
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  useEffect(() => {
    setActiveTenantId(getActiveTenantId());
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    const res = await fetch('/api/companies', { credentials: 'include' });
    const data = await res.json();
    if (data.success) setCompanies(data.data || []);
    setIsLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(createForm)) {
      if (v !== '') payload[k] = v;
    }
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setIsCreating(false);
    if (res.ok) {
      setMessage('Company created.');
      setIsError(false);
      setShowCreate(false);
      setCreateForm(emptyForm);
      fetchCompanies();
    } else {
      setIsError(true);
      setMessage(data.error || 'Failed to create company');
    }
  };

  const startEdit = (company: Company) => {
    setEditingId(company._id);
    setEditForm({
      name: company.name || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      zip: company.zip || '',
      country: company.country || '',
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setIsSaving(true);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(editForm)) {
      if (v !== '') payload[k] = v;
    }
    const res = await fetch(`/api/companies/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setIsSaving(false);
    if (res.ok) {
      setMessage('Company updated.');
      setIsError(false);
      setEditingId(null);
      fetchCompanies();
    } else {
      setIsError(true);
      setMessage(data.error || 'Failed to update company');
    }
  };

  const handleSetActive = async (id: string) => {
    setSwitchingId(id);
    const res = await fetch(`/api/companies/${id}/set-active`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    setSwitchingId(null);
    if (res.ok) {
      setActiveTenantId(id);
      setMessage('Active company switched. All data is now scoped to this company.');
      setIsError(false);
    } else {
      setIsError(true);
      setMessage(data.error || 'Failed to switch company');
    }
  };

  const handleDelete = async () => {
    const id = deactivateModal.id;
    setDeletingId(id);
    const res = await fetch(`/api/companies/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    setDeletingId(null);
    setDeactivateModal({ open: false, id: '', name: '' });
    if (res.ok) {
      setMessage('Company deactivated.');
      setIsError(false);
      fetchCompanies();
    } else {
      setIsError(true);
      setMessage(data.error || 'Failed to deactivate company');
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={deactivateModal.open}
        title="Deactivate Company"
        description={`Deactivate "${deactivateModal.name}"? It will be hidden from all lists. This can be reversed by support.`}
        confirmLabel="Deactivate"
        onConfirm={handleDelete}
        onCancel={() => setDeactivateModal({ open: false, id: '', name: '' })}
        loading={!!deletingId}
        danger
      />

      <div className="page-header">
        <div>
          <h1 className="section-title">Companies</h1>
          <p className="section-subtitle">Manage workspaces and switch active company</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowCreate(true); setEditingId(null); }}
        >
          + New Company
        </button>
      </div>

      {message && (
        <div className={isError ? 'alert-error' : 'alert-success'}>{message}</div>
      )}

      {showCreate && (
        <div className="card mb-6">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold">New Company</h2>
            <button type="button" className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreate} className="card-body space-y-4">
            <CompanyForm
              form={createForm}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
              onCountryChange={(v) => setCreateForm((prev) => ({ ...prev, country: v, state: '' }))}
              onStateChange={(v) => setCreateForm((prev) => ({ ...prev, state: v }))}
            />
            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Company'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="card">
          <div className="card-body text-center text-gray-500">Loading companies...</div>
        </div>
      ) : companies.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-gray-500">No companies yet. Create one to get started.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map((company) => {
            const isActive = company._id === activeTenantId;
            const isEditing = editingId === company._id;

            return (
              <div key={company._id} className="card">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {company.logo && (
                      <img src={company.logo} alt="" className="h-8 w-8 rounded object-contain" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">{company.name}</h2>
                        {isActive && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            Active
                          </span>
                        )}
                        {!company.isActive && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-200">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{company.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && company.isActive && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => handleSetActive(company._id)}
                        disabled={switchingId === company._id}
                      >
                        {switchingId === company._id ? 'Switching...' : 'Set Active'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => (isEditing ? setEditingId(null) : startEdit(company))}
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                    {!isActive && (
                      <button
                        type="button"
                        className="btn btn-sm rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        onClick={() => setDeactivateModal({ open: true, id: company._id, name: company.name })}
                        disabled={!!deletingId}
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <div className="card-body text-sm text-gray-500">
                    {company.address && company.address !== 'To be updated' ? (
                      <p>{[company.address, company.city, company.state, company.country].filter(Boolean).join(', ')}</p>
                    ) : (
                      <p className="italic text-amber-600">Address not configured — go to Settings → Company to complete setup</p>
                    )}
                  </div>
                )}

                {isEditing && (
                  <form onSubmit={handleEdit} className="card-body space-y-4">
                    <CompanyForm
                      form={editForm}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
                      onCountryChange={(v) => setEditForm((prev) => ({ ...prev, country: v, state: '' }))}
                      onStateChange={(v) => setEditForm((prev) => ({ ...prev, state: v }))}
                    />
                    <div className="flex justify-end">
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">
        To configure logo, SMTP, and invoice settings — go to{' '}
        <a href="/admin/settings" className="text-primary-600 underline">Settings → Company</a>
      </p>
    </div>
  );
}
