'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'

interface CaseData {
  id: number
  case_number: string
  client_name: string
  client_initials: string
  case_type: string
  case_category: string
  court_name: string | null
  status: string
  priority: string
  description: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  event_count?: number
  document_count?: number
  pending_tasks?: number
}

interface CaseEvent {
  id: number
  case_id: number
  event_type: string
  title: string
  description: string | null
  author: string | null
  created_at: string
}

interface CaseDocument {
  id: number
  case_id: number
  file_name: string
  file_size: string | null
  file_type: string | null
  file_url: string | null
  uploaded_by: string | null
  created_at: string
}

interface CaseTask {
  id: number
  case_id: number
  title: string
  assignee: string | null
  status: string
  due_date: string | null
  created_at: string
  updated_at: string
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents' | 'tasks'>('timeline')
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [events, setEvents] = useState<CaseEvent[]>([])
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  const [tasks, setTasks] = useState<CaseTask[]>([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(false)

  const loadCase = useCallback(async () => {
    try {
      setLoading(true)
      const res = await adminFetch(`/api/admin/cases?id=${id}`)
      const data = await res.json()
      setCaseData(data.case)
      setEvents(data.events || [])
      setDocuments(data.documents || [])
      setTasks(data.tasks || [])
    } catch (err) {
      console.error('Error loading case:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadCase() }, [loadCase])

  const toggleCaseStatus = async () => {
    if (!caseData) return
    const newStatus = caseData.status === 'closed' ? 'open' : 'closed'
    try {
      await adminFetch('/api/admin/cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: caseData.id, status: newStatus }),
      })
      setCaseData(prev => prev ? { ...prev, status: newStatus } : null)
    } catch (err) {
      console.error('Error updating case:', err)
    }
  }

  const handleToggleTask = async (task: CaseTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      await adminFetch('/api/admin/cases/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      })
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    } catch (err) {
      console.error('Error updating task:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent w-10 h-10" />
      </div>
    )
  }

  if (!caseData) {
    return <div className="text-center py-12 text-[13px] text-[var(--fg-muted)]">Case not found</div>
  }

  const isClosed = caseData.status === 'closed'

  const statusIcon = (icon: string) => {
    switch (icon) {
      case 'check': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400"><polyline points="20 6 9 17 4 12" /></svg>
      case 'file': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      case 'user': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      case 'plus': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      default: return null
    }
  }

  return (
    <div className={`transition-all duration-300 ${isClosed ? 'opacity-60' : ''}`}>
      {isClosed && (
        <div className="bg-[var(--danger-soft)] border border-[var(--danger)] border-dashed rounded-[var(--radius-md)] px-5 py-3 mb-5 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <span className="text-[13px] font-semibold text-[var(--danger)] uppercase tracking-wide">{t.admin.cases.caseClosed as string}</span>
        </div>
      )}

      {/* Client Header */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-5 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent)] to-emerald-600 flex items-center justify-center text-white font-bold text-[16px]">
              {caseData.client_initials || caseData.client_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div>
              <h1 className="text-[16px] font-semibold" style={{ color: 'var(--fg)' }}>{caseData.client_name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[12px] text-[var(--fg-muted)]">{caseData.case_number}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--fg-muted)]" />
                <span className="text-[12px] text-[var(--fg-secondary)]">{caseData.case_type}</span>
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${isClosed ? 'bg-[var(--danger-soft)] text-[var(--danger)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'}`}>
            {isClosed ? 'Closed' : 'Open'}
          </span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-4">
            {(['timeline', 'documents', 'tasks'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-[12px] font-medium rounded-[var(--radius-sm)] transition-colors ${activeTab === tab ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]'}`}>
                {tab === 'timeline' ? t.admin.cases.tabTimeline as string : tab === 'documents' ? t.admin.cases.tabDocuments as string : t.admin.cases.tabTasks as string}
              </button>
            ))}
          </div>

          {/* Timeline */}
          {activeTab === 'timeline' && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-5">
              <h3 className="text-[13px] font-semibold mb-4" style={{ color: 'var(--fg)' }}>{t.admin.cases.timelineTitle as string}</h3>
              <div className="space-y-0">
                {events.map((event, idx) => (
                  <div key={event.id} className="relative pl-8 pb-6 last:pb-0">
                    {idx < events.length - 1 && <div className="absolute left-[15px] top-[30px] bottom-0 w-px bg-[var(--border)]" />}
                    <div className="absolute left-[7px] top-[4px] w-[18px] h-[18px] rounded-full bg-[var(--bg)] border-2 border-[var(--border)] flex items-center justify-center">
                      {statusIcon(event.event_type)}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>{event.title}</div>
                      {event.description && <div className="text-[12px] text-[var(--fg-secondary)] mt-0.5">{event.description}</div>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-[var(--fg-muted)]">{new Date(event.created_at).toLocaleDateString()}</span>
                        {event.author && <><span className="w-1 h-1 rounded-full bg-[var(--fg-muted)]" /><span className="text-[11px] text-[var(--accent)]">{event.author}</span></>}
                      </div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <div className="text-center py-8 text-[13px] text-[var(--fg-muted)]">No events yet</div>}
              </div>
            </div>
          )}

          {/* Documents */}
          {activeTab === 'documents' && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-5">
              <h3 className="text-[13px] font-semibold mb-4" style={{ color: 'var(--fg)' }}>{t.admin.cases.documentsTitle as string}</h3>
              <div onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => e.preventDefault()} className={`border-2 border-dashed rounded-[var(--radius-sm)] p-6 text-center transition-all ${dragging ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] hover:border-[var(--fg-muted)]'}`}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto text-[var(--fg-muted)] mb-2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p className="text-[13px] text-[var(--fg-muted)]">{t.admin.cases.uploadArea as string}</p>
              </div>
              <div className="mt-4 space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg)] rounded-[var(--radius-sm)] border border-[var(--border)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span className="flex-1 text-[12px] truncate" style={{ color: 'var(--fg)' }}>{doc.file_name}</span>
                    {doc.file_size && <span className="text-[11px] text-[var(--fg-muted)]">{doc.file_size}</span>}
                  </div>
                ))}
                {documents.length === 0 && <div className="text-center py-4 text-[12px] text-[var(--fg-muted)]">No documents uploaded</div>}
              </div>
            </div>
          )}

          {/* Tasks */}
          {activeTab === 'tasks' && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-5">
              <h3 className="text-[13px] font-semibold mb-4" style={{ color: 'var(--fg)' }}>{t.admin.cases.tasksTitle as string}</h3>
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-3 bg-[var(--bg)] rounded-[var(--radius-sm)] border border-[var(--border)]">
                    <button onClick={() => handleToggleTask(task)} className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--fg-muted)] hover:border-[var(--accent)]'}`}>
                      {task.status === 'completed' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] font-medium ${task.status === 'completed' ? 'text-[var(--fg-muted)] line-through' : ''}`} style={{ color: task.status === 'completed' ? undefined : 'var(--fg)' }}>{task.title}</div>
                      <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">{task.assignee || 'Unassigned'}{task.due_date ? ` · Due ${task.due_date}` : ''}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${task.status === 'completed' ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-[rgba(96,165,250,0.15)] text-blue-400'}`}>{task.status}</span>
                  </div>
                ))}
                {tasks.length === 0 && <div className="text-center py-4 text-[12px] text-[var(--fg-muted)]">No tasks yet</div>}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0 space-y-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-4 space-y-3">
            <div><div className="text-[11px] text-[var(--fg-muted)] font-medium">{t.admin.cases.metadataCourt as string}</div><div className="text-[13px] mt-0.5" style={{ color: 'var(--fg)' }}>{caseData.court_name || 'Not specified'}</div></div>
            <div><div className="text-[11px] text-[var(--fg-muted)] font-medium">{t.admin.cases.metadataType as string}</div><div className="text-[13px] mt-0.5" style={{ color: 'var(--fg)' }}>{caseData.case_type}</div></div>
            <div><div className="text-[11px] text-[var(--fg-muted)] font-medium">{t.admin.cases.metadataStatus as string}</div><div className="text-[13px] mt-0.5 font-medium" style={{ color: isClosed ? 'var(--danger)' : 'var(--accent)' }}>{isClosed ? 'Closed' : 'Open'}</div></div>
            <div><div className="text-[11px] text-[var(--fg-muted)] font-medium">{t.admin.cases.metadataCreated as string}</div><div className="text-[13px] mt-0.5" style={{ color: 'var(--fg)' }}>{new Date(caseData.created_at).toLocaleDateString()}</div></div>
            <div><div className="text-[11px] text-[var(--fg-muted)] font-medium">{t.admin.cases.metadataUpdated as string}</div><div className="text-[13px] mt-0.5" style={{ color: 'var(--fg)' }}>{new Date(caseData.updated_at).toLocaleDateString()}</div></div>
          </div>

          <button onClick={toggleCaseStatus} className={`w-full px-4 py-2.5 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors flex items-center justify-center gap-2 ${isClosed ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white' : 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isClosed ? <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></> : <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>}
            </svg>
            {isClosed ? t.admin.cases.reopen as string : t.admin.cases.close as string}
          </button>
        </div>
      </div>
    </div>
  )
}
