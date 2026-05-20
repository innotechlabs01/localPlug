'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

const kpiCards = [
  {
    labelKey: 'totalClients',
    value: '142',
    change: '+12%',
    trend: 'up',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    color: 'accent',
  },
  {
    labelKey: 'activeTasks',
    value: '48',
    change: '+3 today',
    trend: 'up',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    color: 'info',
  },
  {
    labelKey: 'overdue',
    value: '3',
    change: 'Requires immediate attention',
    trend: 'down',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    color: 'danger',
    highlight: true,
  },
  {
    labelKey: 'stale',
    value: '7',
    change: 'Needs review',
    trend: 'neutral',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    color: 'warning',
    highlight: true,
  },
]

const colorMap: Record<string, { bg: string; text: string; bar: string }> = {
  accent: { bg: 'bg-[rgba(16,185,129,0.12)]', text: 'text-[#10b981]', bar: 'bg-[#10b981]' },
  info: { bg: 'bg-[rgba(59,130,246,0.12)]', text: 'text-[#3b82f6]', bar: 'bg-[#3b82f6]' },
  danger: { bg: 'bg-[rgba(239,68,80,0.12)]', text: 'text-[#ef4450]', bar: 'bg-[#ef4450]' },
  warning: { bg: 'bg-[rgba(245,158,11,0.12)]', text: 'text-[#f59e0b]', bar: 'bg-[#f59e0b]' },
}

const lawyersAtRisk = [
  { caseId: '#1089', task: 'Draft Right of Petition (Derecho de Petición)', attorney: 'Alejandro Ríos', days: '1 day left', badge: 'High Risk', badgeColor: 'danger' },
  { caseId: '#1102', task: 'File Judicial Demand (Radicar Demanda)', attorney: 'Maria Alejandra', days: '2 days left', badge: 'Warning', badgeColor: 'warning' },
  { caseId: '#1054', task: 'File Injunction Review (Impugnación Tutela)', attorney: 'Keith Vance', days: 'Overdue', badge: 'Critical', badgeColor: 'danger' },
]

const badgeStyles: Record<string, string> = {
  danger: 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]',
  warning: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]',
}

export default function AdminDashboard() {
  const { t } = useI18n()
  return (
    <div className="space-y-6">
      {/* Status Analytics Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#646880] opacity-60"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#646880]">{t.admin.dashboard.statusAnalytics as string}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {kpiCards.map((kpi) => {
            const colors = colorMap[kpi.color]
            return (
              <div
                key={kpi.labelKey}
                className="relative bg-[#181b25] border border-[#282b38] rounded-[10px] p-4 transition-all duration-200 hover:border-[#10b981] hover:shadow-[0_0_0_1px_rgba(16,185,129,0.12)] overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-[3px] ${colors.bar}`} />
                <div className="flex items-start justify-between mb-2.5">
                  <div className={`w-[38px] h-[38px] rounded-[6px] ${colors.bg} ${colors.text} flex items-center justify-center text-[18px]`}>
                    {kpi.icon}
                  </div>
                </div>
                <div className="text-[11px] font-medium text-[#646880] mb-1">{t.admin.dashboard[kpi.labelKey as keyof typeof t.admin.dashboard] as string}</div>
                <div className="text-[24px] font-bold text-[#f0f2f5] leading-tight">{kpi.value}</div>
                <div className={`text-[12px] font-medium mt-1.5 flex items-center gap-1 ${
                  kpi.trend === 'up' ? 'text-[#10b981]' : kpi.trend === 'down' ? 'text-[#ef4450]' : 'text-[#646880]'
                }`}>
                  {kpi.trend === 'up' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>}
                  {kpi.trend === 'down' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>}
                  {kpi.change}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Critical Hearing Alerts Bar */}
      <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#282b38] flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4450" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          <span className="text-[13px] font-semibold text-[#f0f2f5]">{t.admin.dashboard.criticalAlerts as string}</span>
          <span className="ml-auto bg-[rgba(239,68,80,0.12)] text-[#ef4450] text-[10px] font-semibold px-2 py-0.5 rounded-full">LIVE</span>
        </div>
        <div className="p-4 md:p-5">
          <div className="flex items-start gap-3 bg-[rgba(239,68,80,0.06)] border-l-[3px] border-[#ef4450] rounded-[6px] p-3.5">
            <div className="w-2 h-2 rounded-full bg-[#ef4450] mt-1.5 shrink-0 animate-pulse shadow-[0_0_8px_#ef4450]" />
            <div>
              <p className="text-[13px] font-medium text-[#f0f2f5]">
                Upcoming Audiencia de Conciliación
              </p>
              <p className="text-[12px] text-[#9ca0b0] mt-0.5">
                Case #1024 (Client: Carlos Mendoza) — Tomorrow at 09:00 AM in Juzgado 05 Laboral
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lawyer Overload & Delayed Cases */}
      <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#282b38] flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="text-[13px] font-semibold text-[#f0f2f5]">{t.admin.dashboard.lawyerOverload as string}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#282b38]">
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.dashboard.tableCaseId as string}</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.dashboard.tableTask as string}</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.dashboard.tableAttorney as string}</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.dashboard.tableDaysRemaining as string}</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880]">{t.admin.dashboard.tableStatus as string}</th>
              </tr>
            </thead>
            <tbody>
              {lawyersAtRisk.map((row) => (
                <tr key={row.caseId} className="border-b border-[#282b38] last:border-b-0 hover:bg-[#202330] transition-colors">
                  <td className="px-5 py-3 text-[13px] font-medium text-[#f0f2f5]">{row.caseId}</td>
                  <td className="px-5 py-3 text-[13px] text-[#9ca0b0] max-w-[300px] truncate">{row.task}</td>
                  <td className="px-5 py-3 text-[13px] text-[#f0f2f5]">{row.attorney}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[13px] font-mono font-semibold ${
                      row.days === 'Overdue' ? 'text-[#ef4450]' : row.badge === 'Warning' ? 'text-[#f59e0b]' : 'text-[#f0f2f5]'
                    }`}>
                      {row.days}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeStyles[row.badgeColor]}`}>
                      {row.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Link href="/admin/customers" className="bg-[#181b25] border border-[#282b38] rounded-[10px] p-4 flex items-center gap-3.5 hover:border-[#10b981] transition-all duration-200 group">
          <div className="w-[40px] h-[40px] rounded-[8px] bg-[rgba(59,130,246,0.12)] text-[#3b82f6] flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div>
            <div className="text-[13px] font-medium text-[#f0f2f5]">{t.admin.dashboard.quickClient as string}</div>
            <div className="text-[11px] text-[#646880]">{t.admin.dashboard.quickClientDesc as string}</div>
          </div>
        </Link>
        <Link href="/admin/employees" className="bg-[#181b25] border border-[#282b38] rounded-[10px] p-4 flex items-center gap-3.5 hover:border-[#10b981] transition-all duration-200 group">
          <div className="w-[40px] h-[40px] rounded-[8px] bg-[rgba(16,185,129,0.12)] text-[#10b981] flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <div className="text-[13px] font-medium text-[#f0f2f5]">{t.admin.dashboard.quickEmployee as string}</div>
            <div className="text-[11px] text-[#646880]">{t.admin.dashboard.quickEmployeeDesc as string}</div>
          </div>
        </Link>
        <Link href="/admin/cases/1024" className="bg-[#181b25] border border-[#282b38] rounded-[10px] p-4 flex items-center gap-3.5 hover:border-[#10b981] transition-all duration-200 group">
          <div className="w-[40px] h-[40px] rounded-[8px] bg-[rgba(245,158,11,0.12)] text-[#f59e0b] flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          </div>
          <div>
            <div className="text-[13px] font-medium text-[#f0f2f5]">{t.admin.dashboard.quickExpediente as string}</div>
            <div className="text-[11px] text-[#646880]">{t.admin.dashboard.quickExpedienteDesc as string}</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
