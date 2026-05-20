'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

const timelineEvents = [
  { id: 1, time: 'Today, 10:23 AM', icon: 'check', title: 'Demanda Radicada', description: 'Demanda formal radicada ante el Juzgado 05 Laboral del Circuito de Medellín.', author: 'Alejandro Ríos' },
  { id: 2, time: 'Yesterday, 2:15 PM', icon: 'file', title: 'Poder Actualizado', description: 'Poder especial updated and notarized for court representation.', author: 'Maria Alejandra' },
  { id: 3, time: 'May 15, 2026', icon: 'user', title: 'Cliente Contactado', description: 'Initial consultation completed. Case strategy defined.', author: 'Carolina Gomez' },
  { id: 4, time: 'May 10, 2026', icon: 'plus', title: 'Caso Creado', description: 'Expediente opened for Reclamación de Pensiones under Ley 100 de 1993.', author: 'Sistema' },
]

const mockDocuments = [
  { name: 'Demanda_Laboral_Carlos_Mendoza.pdf', size: '2.4 MB', type: 'PDF' },
  { name: 'Poder_Especial_Notariado.pdf', size: '0.8 MB', type: 'PDF' },
  { name: 'Soporte_Historia_Laboral_COLPENSIONES.pdf', size: '4.1 MB', type: 'PDF' },
]

const mockTasks = [
  { id: 'T-001', title: 'Revisar respuesta de COLPENSIONES', assignee: 'Alejandro Ríos', status: 'Completed', due: 'May 18' },
  { id: 'T-002', title: 'Preparar escrito de subsanación', assignee: 'Maria Alejandra', status: 'Pending', due: 'May 22' },
  { id: 'T-003', title: 'Notificar auto admisorio', assignee: 'Carolina Gomez', status: 'Scheduled', due: 'May 25' },
]

export default function CaseDetailPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents' | 'tasks'>('timeline')
  const [caseClosed, setCaseClosed] = useState(false)
  const [dragging, setDragging] = useState(false)

  const toggleCaseStatus = () => setCaseClosed(!caseClosed)

  const statusIcon = (icon: string) => {
    switch (icon) {
      case 'check': return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#10b981]"><polyline points="20 6 9 17 4 12" /></svg>
      )
      case 'file': return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#3b82f6]"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      )
      case 'user': return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f59e0b]"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      )
      case 'plus': return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#a78bfa]"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      )
      default: return null
    }
  }

  const TabButton = ({ tab, label }: { tab: 'timeline' | 'documents' | 'tasks'; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2.5 text-[13px] font-medium rounded-[6px] transition-all duration-200 ${
        activeTab === tab
          ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]'
          : 'text-[#9ca0b0] hover:text-[#f0f2f5] hover:bg-[#202330]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className={`transition-all duration-300 ${caseClosed ? 'opacity-60 pointer-events-none' : ''}`}>
      {caseClosed && (
        <div className="bg-[rgba(239,68,80,0.1)] border border-[#ef4450] border-dashed rounded-[10px] px-5 py-3 mb-6 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4450" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <span className="text-[13px] font-semibold text-[#ef4450] uppercase tracking-[0.5px]">{t.admin.cases.caseClosed as string}</span>
        </div>
      )}

      {/* Client Context Header */}
      <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] p-5 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-bold text-[18px]">CM</div>
            <div>
              <h1 className="text-[18px] font-semibold text-[#f0f2f5]">Carlos Mendoza</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[13px] text-[#646880]">Case #1024</span>
                <span className="w-1 h-1 rounded-full bg-[#646880]" />
                <span className="text-[13px] text-[#9ca0b0]">Laboral — Reclamación de Pensiones</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: Tabs + Content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <TabButton tab="timeline" label={t.admin.cases.tabTimeline as string} />
            <TabButton tab="documents" label={t.admin.cases.tabDocuments as string} />
            <TabButton tab="tasks" label={t.admin.cases.tabTasks as string} />
          </div>

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] p-5">
              <h3 className="text-[14px] font-semibold text-[#f0f2f5] mb-4">{t.admin.cases.timelineTitle as string}</h3>
              <div className="space-y-0">
                {timelineEvents.map((event, idx) => (
                  <div key={event.id} className="relative pl-8 pb-6 last:pb-0">
                    {idx < timelineEvents.length - 1 && (
                      <div className="absolute left-[15px] top-[30px] bottom-0 w-px bg-[#282b38]" />
                    )}
                    <div className="absolute left-[7px] top-[4px] w-[18px] h-[18px] rounded-full bg-[#0b0d14] border-2 border-[#282b38] flex items-center justify-center">
                      {statusIcon(event.icon)}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[#f0f2f5]">{event.title}</div>
                      <div className="text-[12px] text-[#9ca0b0] mt-0.5">{event.description}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-[#646880]">{event.time}</span>
                        <span className="w-1 h-1 rounded-full bg-[#646880]" />
                        <span className="text-[11px] text-[#10b981]">{event.author}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] p-5">
              <h3 className="text-[14px] font-semibold text-[#f0f2f5] mb-4">{t.admin.cases.documentsTitle as string}</h3>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-[8px] p-6 text-center transition-all ${
                  dragging ? 'border-[#10b981] bg-[rgba(16,185,129,0.06)]' : 'border-[#282b38] hover:border-[#646880]'
                } ${caseClosed ? 'opacity-50' : ''}`}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto text-[#646880] mb-2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p className="text-[13px] text-[#9ca0b0]">{t.admin.cases.uploadArea as string}</p>
              </div>

              <div className="mt-4 space-y-2">
                {mockDocuments.map((doc) => (
                  <div key={doc.name} className="flex items-center gap-3 px-3 py-2.5 bg-[#0b0d14] rounded-[6px] border border-[#282b38]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span className="flex-1 text-[13px] text-[#f0f2f5] truncate">{doc.name}</span>
                    <span className="text-[11px] text-[#646880]">{doc.size}</span>
                    <a href="#" className="text-[12px] text-[#10b981] hover:text-[#34d399] transition-colors font-medium">Download</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] p-5">
              <h3 className="text-[14px] font-semibold text-[#f0f2f5] mb-4">{t.admin.cases.tasksTitle as string}</h3>
              <div className="space-y-2">
                {mockTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-3 bg-[#0b0d14] rounded-[6px] border border-[#282b38]">
                    <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center ${
                      task.status === 'Completed' ? 'bg-[#10b981] border-[#10b981]' : 'border-[#646880]'
                    }`}>
                      {task.status === 'Completed' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] font-medium ${task.status === 'Completed' ? 'text-[#646880] line-through' : 'text-[#f0f2f5]'}`}>
                        {task.title}
                      </div>
                      <div className="text-[11px] text-[#646880] mt-0.5">{task.assignee} · Due {task.due}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      task.status === 'Completed' ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]' : 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0 space-y-4">
          <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] p-4 space-y-3">
            <div><div className="text-[11px] text-[#646880] font-medium">{t.admin.cases.metadataCourt as string}</div><div className="text-[13px] text-[#f0f2f5] mt-0.5">Juzgado 05 Laboral</div></div>
            <div><div className="text-[11px] text-[#646880] font-medium">{t.admin.cases.metadataType as string}</div><div className="text-[13px] text-[#f0f2f5] mt-0.5">Reclamación de Pensiones</div></div>
            <div><div className="text-[11px] text-[#646880] font-medium">{t.admin.cases.metadataStatus as string}</div><div className="text-[13px] text-[#f59e0b] mt-0.5 font-medium">En Proceso</div></div>
            <div><div className="text-[11px] text-[#646880] font-medium">{t.admin.cases.metadataCreated as string}</div><div className="text-[13px] text-[#f0f2f5] mt-0.5">May 10, 2026</div></div>
            <div><div className="text-[11px] text-[#646880] font-medium">{t.admin.cases.metadataUpdated as string}</div><div className="text-[13px] text-[#f0f2f5] mt-0.5">Today, 10:23 AM</div></div>
          </div>

          <button
            onClick={toggleCaseStatus}
            className={`w-full px-4 py-2.5 rounded-[6px] text-[13px] font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              caseClosed
                ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981] border border-[#10b981] hover:bg-[rgba(16,185,129,0.2)]'
                : 'bg-[rgba(239,68,80,0.12)] text-[#ef4450] border border-[#ef4450] hover:bg-[rgba(239,68,80,0.2)]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {caseClosed
                ? <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>
                : <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>
              }
            </svg>
            {caseClosed ? t.admin.cases.reopen as string : t.admin.cases.close as string}
          </button>
        </div>
      </div>
    </div>
  )
}
