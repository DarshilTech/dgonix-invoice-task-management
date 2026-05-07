'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { RegionSelect } from '@/components/ui/RegionSelect';

type Company = { _id: string; name: string };
type Client = {
  _id: string;
  tenantId: string;
  companyId: string;
  name: string;
  email: string;
  contactPerson?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  status: 'active' | 'inactive';
  portalAccess: boolean;
};

const emptyForm = {
  companyId: '', name: '', email: '', contactPerson: '', phone: '',
  address: '', city: '', state: '', zip: '', country: '', taxId: '', portalAccess: true,
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; clientId: string; clientName: string }>({ open: false, clientId: '', clientName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const selectedCompanyId = useMemo(
    () => form.companyId || companies[0]?._id || '',
    [companies, form.companyId]
  );

  useEffect(() => { fetchCompanies(); }, []);
  useEffect(() => { fetchClients(); }, [debouncedSearch, page]);

  const fetchCompanies = async () => {
    const res = await fetch('/api/companies', { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setCompanies(data.data || []);
      setForm((prev) => ({ ...prev, companyId: prev.companyId || data.data?.[0]?._id || '' }));
    }
  };

  const fetchClients = async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    const res = await fetch(`/api/clients?${params}`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setClients(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setEditingClient(null);
    setForm({ ...emptyForm, companyId: companies[0]?._id || '' });
    setShowForm(false);
  };

  const submitClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = { ...form, companyId: selectedCompanyId, tenantId: selectedCompanyId };
    const url = editingClient ? `/api/clients/${editingClient._id}` : '/api/clients';
    const method = editingClient ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setIsSaving(false);
    if (!res.ok) { setIsError(true); setMessage(data.error || 'Could not save client'); return; }
    setIsError(false);
    setMessage(editingClient ? 'Client updated.' : 'Client created.');
    resetForm();
    fetchClients();
  };

  const editClient = (client: Client) => {
    setEditingClient(client);
    setForm({
      companyId: client.tenantId || client.companyId,
      name: client.name, email: client.email,
      contactPerson: client.contactPerson || '', phone: client.phone || '',
      address: client.address, city: client.city, state: client.state,
      zip: client.zip, country: client.country, taxId: '', portalAccess: client.portalAccess,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (client: Client) => {
    setConfirmModal({ open: true, clientId: client._id, clientName: client.name });
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    const res = await fetch(`/api/clients/${confirmModal.clientId}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    setIsDeleting(false);
    setConfirmModal({ open: false, clientId: '', clientName: '' });
    setIsError(!res.ok);
    setMessage(res.ok ? 'Client deleted.' : data.error || 'Could not delete client');
    if (res.ok) fetchClients();
  };

  return (
    <div className="space-y-6">

      <ConfirmModal
        open={confirmModal.open}
        title="Delete Client"
        description={`Are you sure you want to delete "${confirmModal.clientName}"? This will permanently remove all associated records and cannot be undone.`}
        confirmLabel="Delete Client"
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ open: false, clientId: '', clientName: '' })}
        loading={isDeleting}
        danger
      />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Clients</h1>
          <p className="section-subtitle">{totalCount > 0 ? `${totalCount} client${totalCount !== 1 ? 's' : ''}` : 'Manage your client accounts'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingClient(null); setForm({ ...emptyForm, companyId: companies[0]?._id || '' }); }} type="button">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Client
        </button>
      </div>

      {message && (
        <div className={isError ? 'alert-error' : 'alert-success'}>{message}</div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={submitClient} className="card animate-slide-up">
          <div className="card-header">
            <h2 className="font-semibold">{editingClient ? 'Edit Client' : 'New Client'}</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetForm}>Cancel</button>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Company</label>
              <select className="input" value={selectedCompanyId} onChange={(e) => setForm((p) => ({ ...p, companyId: e.target.value }))} required>
                {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Client Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Contact Person</label>
              <input className="input" value={form.contactPerson} onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Street Address</label>
              <input className="input" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} required />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Zip / Postal Code</label>
              <input className="input" value={form.zip} onChange={(e) => setForm((p) => ({ ...p, zip: e.target.value }))} required />
            </div>
            <RegionSelect
              country={form.country}
              state={form.state}
              onCountryChange={(v) => setForm((p) => ({ ...p, country: v, state: '' }))}
              onStateChange={(v) => setForm((p) => ({ ...p, state: v }))}
              required
            />
            <div className="md:col-span-2 flex items-center gap-2 pt-1">
              <input type="checkbox" id="portalAccess" checked={form.portalAccess} onChange={(e) => setForm((p) => ({ ...p, portalAccess: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <label htmlFor="portalAccess" className="text-sm text-gray-700">Enable client portal access (OTP login)</label>
            </div>
          </div>
          <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingClient ? 'Save Changes' : 'Create Client'}
            </button>
            <button className="btn btn-secondary" onClick={resetForm} type="button">Cancel</button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="search-wrap">
        <svg className="search-icon h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input className="input max-w-sm pl-9" placeholder="Search clients by name or email…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>

      {/* Table (desktop) + Cards (mobile) */}
      {isLoading ? (
        <div className="card divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-skeleton">
              <div className="h-8 w-8 rounded-full skeleton shrink-0" />
              <div className="flex-1 space-y-1.5"><div className="h-4 w-40 skeleton" /><div className="h-3 w-28 skeleton" /></div>
              <div className="h-6 w-16 skeleton rounded-full" />
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState title="No clients yet" description="Add your first client to start issuing invoices." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden md:block">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Contact</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Portal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div className="font-semibold text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-400">{c.email}</div>
                      </td>
                      <td className="text-gray-600">{c.contactPerson || c.phone || '—'}</td>
                      <td className="text-gray-600">{[c.city, c.country].filter(Boolean).join(', ') || '—'}</td>
                      <td><span className={`badge ${c.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{c.status}</span></td>
                      <td>
                        <span className={`badge ${c.portalAccess ? 'badge-active' : 'badge-inactive'}`}>
                          {c.portalAccess ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-3">
                          <button className="text-sm font-medium text-primary-600 hover:text-primary-700" onClick={() => editClient(c)} type="button">Edit</button>
                          <button className="text-sm font-medium text-red-600 hover:text-red-700" onClick={() => confirmDelete(c)} type="button">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {clients.map((c) => (
              <div className="card p-4" key={c._id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    <p className="text-sm text-gray-500">{c.email}</p>
                    {(c.city || c.country) && <p className="mt-0.5 text-xs text-gray-400">{[c.city, c.country].filter(Boolean).join(', ')}</p>}
                  </div>
                  <span className={`badge shrink-0 ${c.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{c.status}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="btn btn-secondary btn-sm flex-1" onClick={() => editClient(c)} type="button">Edit</button>
                  <button className="btn btn-danger btn-sm flex-1" onClick={() => confirmDelete(c)} type="button">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} type="button">← Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} type="button">Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
