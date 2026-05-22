'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

interface Client {
  id: string
  name: string
  type: string
  status: 'Active' | 'Inactive'
  email: string
  phone: string
  createdAt: string
}

const initialClients: Client[] = [
  { id: '#101', name: 'Carlos Mendoza', type: 'Laboral', status: 'Active', email: 'carlos.mendoza@email.com', phone: '+57 300 123 4567', createdAt: 'Jan 15, 2026' },
  { id: '#102', name: 'Diana Restrepo', type: 'Civil / Familia', status: 'Active', email: 'diana.restrepo@email.com', phone: '+57 300 234 5678', createdAt: 'Feb 03, 2026' },
  { id: '#103', name: 'Inversiones Alfa SAS', type: 'Comercial', status: 'Inactive', email: 'contacto@alfainversiones.com', phone: '+57 601 345 6789', createdAt: 'Mar 20, 2025' },
]

export default function CustomersPage() {
  const { t } = useI18n()
  const d = t.admin.customers
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<Client>>({})

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase()),
  )

  const openNew = () => {
    setEditingClient(null)
    setFormData({ name: '', type: '', email: '', phone: '', status: 'Active' })
    setShowForm(true)
  }

  const openEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({ ...client })
    setShowForm(true)
  }

  const saveClient = () => {
    if (editingClient) {
      setClients(clients.map((c) => (c.id === editingClient.id ? { ...c, ...formData } as Client : c)))
    } else {
      const newId = `#${Date.now().toString().slice(-4)}`
      setClients([...clients, { ...formData, id: newId, createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) } as Client])
    }
    setShowForm(false)
  }

  const toggleStatus = (client: Client) => {
    setClients(clients.map((c) => (c.id === client.id ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c)))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-semibold text-[#f0f2f5]">{t.admin.customers.title as string}</h1>
          <p className="text-[13px] text-[#646880] mt-0.5">{t.admin.customers.subtitle.replace('{count}', String(clients.length)) as string}</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-[#10b981] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#059669] transition-all flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t.admin.customers.add as string}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-[300px]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#646880]">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={t.admin.customers.search as string}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] placeholder:text-[#646880] outline-none focus:border-[#10b981] transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#282b38]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.customers.tableId as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.customers.tableName as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.customers.tableType as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.customers.tableStatus as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.customers.tableEmail as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.customers.tablePhone as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.customers.tableCreated as string}</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.customers.tableActions as string}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-b border-[#282b38] last:border-b-0 hover:bg-[#202330] transition-colors">
                  <td className="px-5 py-3 text-[13px] font-medium text-[#f0f2f5]">{client.id}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => setSelectedClient(client)} className="text-[13px] font-medium text-[#10b981] hover:text-[#34d399] transition-colors">
                      {client.name}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#9ca0b0]">{client.type}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                      client.status === 'Active'
                        ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]'
                        : 'bg-[rgba(100,104,128,0.12)] text-[#646880]'
                    }`}>
                      {client.status === 'Active' ? t.admin.customers.statusActive as string : t.admin.customers.statusInactive as string}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#9ca0b0]">{client.email}</td>
                  <td className="px-5 py-3 text-[13px] text-[#9ca0b0] font-mono">{client.phone}</td>
                  <td className="px-5 py-3 text-[13px] text-[#9ca0b0]">{client.createdAt}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(client)} className="p-1.5 rounded-[4px] text-[#9ca0b0] hover:bg-[#202330] hover:text-[#3b82f6] transition-all" title={d.titleEdit || 'Edit'}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => toggleStatus(client)} className={`p-1.5 rounded-[4px] transition-all ${
                        client.status === 'Active'
                          ? 'text-[#9ca0b0] hover:bg-[#202330] hover:text-[#f59e0b]'
                          : 'text-[#9ca0b0] hover:bg-[#202330] hover:text-[#10b981]'
                      }`} title={client.status === 'Active' ? d.titleDeactivate || 'Deactivate' : d.titleActivate || 'Activate'}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {client.status === 'Active' ? (
                            <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>
                          ) : (
                            <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>
                          )}
                        </svg>
                      </button>
                      <button onClick={() => setSelectedClient(client)} className="p-1.5 rounded-[4px] text-[#9ca0b0] hover:bg-[#202330] hover:text-[#10b981] transition-all" title={d.titleView || 'View'}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#646880] text-[14px]">{t.admin.customers.noResults as string}</div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-6" onClick={() => setSelectedClient(null)}>
          <div className="w-full max-w-[480px] bg-[#181b25] border border-[#282b38] rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#282b38] flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#f0f2f5]">{t.admin.customers.modalTitle as string}</h3>
              <button onClick={() => setSelectedClient(null)} className="text-[#646880] hover:text-[#f0f2f5] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-[#282b38]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-semibold text-[15px]">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-[#f0f2f5]">{selectedClient.name}</div>
                  <div className="text-[12px] text-[#646880]">{selectedClient.id}</div>
                </div>
                <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                  selectedClient.status === 'Active'
                    ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]'
                    : 'bg-[rgba(100,104,128,0.12)] text-[#646880]'
                }`}>
                  {selectedClient.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-[11px] text-[#646880] font-medium">{d.labelType || 'Type'}</div><div className="text-[13px] text-[#f0f2f5] mt-0.5">{selectedClient.type}</div></div>
                <div><div className="text-[11px] text-[#646880] font-medium">{d.labelCreated || 'Created'}</div><div className="text-[13px] text-[#f0f2f5] mt-0.5">{selectedClient.createdAt}</div></div>
                <div className="col-span-2"><div className="text-[11px] text-[#646880] font-medium">{d.labelEmail || 'Email'}</div><div className="text-[13px] text-[#f0f2f5] mt-0.5">{selectedClient.email}</div></div>
                <div className="col-span-2"><div className="text-[11px] text-[#646880] font-medium">{d.labelPhone || 'Phone'}</div><div className="text-[13px] text-[#f0f2f5] mt-0.5 font-mono">{selectedClient.phone}</div></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#282b38] flex gap-2 justify-end">
              <button onClick={() => setSelectedClient(null)} className="px-4 py-2 bg-transparent border border-[#282b38] text-[#f0f2f5] rounded-[6px] text-[13px] font-medium hover:bg-[#202330] transition-all">{t.admin.customers.modalClose as string}</button>
              <Link
                href={`/admin/cases/${selectedClient.id.replace('#', '')}`}
                className="px-4 py-2 bg-[#10b981] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#059669] transition-all"
              >
                {t.admin.customers.modalViewCase as string}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-6" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-[480px] bg-[#181b25] border border-[#282b38] rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#282b38] flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#f0f2f5]">{editingClient ? t.admin.customers.modalEdit as string : t.admin.customers.modalAdd as string}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#646880] hover:text-[#f0f2f5] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#9ca0b0]">{t.admin.customers.formName as string}</label>
                <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#9ca0b0]">{t.admin.customers.formType as string}</label>
                <select value={formData.type || ''} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all">
                  <option value="">{d.selectType || 'Select type'}</option>
                  <option value="Laboral">Laboral</option>
                  <option value="Civil / Familia">Civil / Familia</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Administrativo">Administrativo</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#9ca0b0]">{t.admin.customers.formEmail as string}</label>
                <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#9ca0b0]">{t.admin.customers.formPhone as string}</label>
                <input type="text" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[#13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#9ca0b0]">{t.admin.customers.formStatus as string}</label>
                <select value={formData.status || 'Active'} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })} className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all">
                  <option value="Active">{d.optionActive || 'Active'}</option>
                  <option value="Inactive">{d.optionInactive || 'Inactive'}</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#282b38] flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-transparent border border-[#282b38] text-[#f0f2f5] rounded-[6px] text-[13px] font-medium hover:bg-[#202330] transition-all">{t.admin.customers.cancel as string}</button>
              <button onClick={saveClient} className="px-4 py-2 bg-[#10b981] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#059669] transition-all">
                {editingClient ? t.admin.customers.saveChanges as string : t.admin.customers.modalAdd as string}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

