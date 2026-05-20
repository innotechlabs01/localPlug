'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

interface Employee {
  id: string
  name: string
  role: string
  license: string
  specialty: string
  email: string
  status: 'Active' | 'Inactive'
}

const initialEmployees: Employee[] = [
  { id: '#E001', name: 'Alejandro Ríos', role: 'Senior Attorney', license: 'TP-873642', specialty: 'Laboral & Seguridad Social', email: 'alejandro.rios@localplug.com', status: 'Active' },
  { id: '#E002', name: 'Maria Alejandra', role: 'Junior Attorney', license: 'TP-992145', specialty: 'Derecho Administrativo & Tutelas', email: 'maria.alejandra@localplug.com', status: 'Active' },
  { id: '#E003', name: 'Carolina Gomez', role: 'Legal Secretary', license: 'N/A', specialty: 'Gestión Documental y Radicados', email: 'carolina.gomez@localplug.com', status: 'Active' },
]

export default function EmployeesPage() {
  const { t } = useI18n()
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<Partial<Employee>>({})

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase()) ||
    e.specialty.toLowerCase().includes(search.toLowerCase()),
  )

  const openNew = () => {
    setEditingEmployee(null)
    setFormData({ name: '', role: '', license: '', specialty: '', email: '', status: 'Active' })
    setShowForm(true)
  }

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    setFormData({ ...emp })
    setShowForm(true)
  }

  const saveEmployee = () => {
    if (editingEmployee) {
      setEmployees(employees.map((e) => (e.id === editingEmployee.id ? { ...e, ...formData } as Employee : e)))
    } else {
      const newId = `#E${String(employees.length + 1).padStart(3, '0')}`
      setEmployees([...employees, { ...formData, id: newId } as Employee])
    }
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-semibold text-[#f0f2f5]">{t.admin.employees.title as string}</h1>
          <p className="text-[13px] text-[#646880] mt-0.5">{t.admin.employees.subtitle.replace('{count}', String(employees.length)) as string}</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-[#10b981] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#059669] transition-all flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t.admin.employees.add as string}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-[300px]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#646880]">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={t.admin.employees.search as string}
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
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.employees.tableName as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.employees.tableRole as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.employees.tableLicense as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.employees.tableSpecialty as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.employees.tableEmail as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.employees.tableStatus as string}</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.employees.tableActions as string}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-[#282b38] last:border-b-0 hover:bg-[#202330] transition-colors">
                  <td className="px-5 py-3 text-[13px] font-medium text-[#f0f2f5]">{emp.name}</td>
                  <td className="px-5 py-3">
                    <span className="text-[13px] text-[#9ca0b0]">{emp.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[13px] font-mono text-[#9ca0b0]">{emp.license}</span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#9ca0b0] max-w-[220px] truncate">{emp.specialty}</td>
                  <td className="px-5 py-3 text-[13px] text-[#9ca0b0]">{emp.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                      emp.status === 'Active'
                        ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]'
                        : 'bg-[rgba(100,104,128,0.12)] text-[#646880]'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(emp)} className="p-1.5 rounded-[4px] text-[#9ca0b0] hover:bg-[#202330] hover:text-[#3b82f6] transition-all" title="Edit">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#646880] text-[14px]">{t.admin.employees.noResults as string}</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-6" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-[480px] bg-[#181b25] border border-[#282b38] rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#282b38] flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#f0f2f5]">{editingEmployee ? t.admin.employees.modalEdit as string : t.admin.employees.modalAdd as string}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#646880] hover:text-[#f0f2f5] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#9ca0b0]">{t.admin.employees.formName as string}</label>
                  <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#9ca0b0]">{t.admin.employees.formRole as string}</label>
                  <select value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all">
                    <option value="">Select role</option>
                    <option value="Senior Attorney">Senior Attorney</option>
                    <option value="Junior Attorney">Junior Attorney</option>
                    <option value="Legal Secretary">Legal Secretary</option>
                    <option value="Paralegal">Paralegal</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#9ca0b0]">{t.admin.employees.formLicense as string}</label>
                  <input type="text" value={formData.license || ''} onChange={(e) => setFormData({ ...formData, license: e.target.value })} placeholder="TP-XXXXX" className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#9ca0b0]">{t.admin.employees.formStatus as string}</label>
                  <select value={formData.status || 'Active'} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })} className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#9ca0b0]">{t.admin.employees.formSpecialty as string}</label>
                <input type="text" value={formData.specialty || ''} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#9ca0b0]">{t.admin.employees.formEmail as string}</label>
                <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#282b38] flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-transparent border border-[#282b38] text-[#f0f2f5] rounded-[6px] text-[13px] font-medium hover:bg-[#202330] transition-all">{t.admin.employees.cancel as string}</button>
              <button onClick={saveEmployee} className="px-4 py-2 bg-[#10b981] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#059669] transition-all">
                {editingEmployee ? t.admin.employees.saveChanges as string : t.admin.employees.modalAdd as string}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
