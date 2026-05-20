'use client'

import { useState, useEffect } from 'react'
import { I18nProvider, useI18n } from '@/lib/i18n'

interface TeamMember {
  id: number
  name: string
  email: string
  roles: string
  status: string
  orders_assigned: number
  last_active: string
}

function TeamInner() {
  const { t } = useI18n()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/team')
      .then(r => r.json())
      .then(data => {
        setMembers(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    concierge: 'bg-green-100 text-green-800',
    viewer: 'bg-cool-slate-100 text-cool-slate-600',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cool-slate-500">Loading team...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg text-slate-navy">{t.admin.team.title}</h1>
          <p className="text-body-md text-cool-slate-500 mt-1">{t.admin.team.subtitle}</p>
        </div>
        <button className="px-4 py-2 bg-mountain-emerald text-white rounded-lg hover:bg-mountain-emerald/90 transition-colors text-label-md">
          {t.admin.team.addMember}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {members.map((member) => (
          <div key={member.id} className="bg-white rounded-xl p-6 shadow-sm border border-cool-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-navy flex items-center justify-center text-white text-lg font-bold">
                {member.name.charAt(0)}
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-medium ${roleColors[member.roles?.split(',')[0] || 'viewer']}`}>
                {member.roles?.split(',')[0] || 'viewer'}
              </span>
            </div>
            <h3 className="text-display-md text-slate-navy mb-1">{member.name}</h3>
            <p className="text-body-md text-cool-slate-500 mb-4">{member.email}</p>
            <div className="flex items-center justify-between text-body-md">
              <span className="text-cool-slate-500">{t.admin.team.ordersAssigned}</span>
              <span className="text-slate-navy font-medium">{member.orders_assigned}</span>
            </div>
            <div className="flex items-center justify-between text-body-md mt-2">
              <span className="text-cool-slate-500">{t.admin.team.status}</span>
              <span className={`px-2 py-0.5 rounded-full text-label-sm ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-cool-slate-100 text-cool-slate-600'}`}>
                {member.status === 'active' ? t.admin.team.active : t.admin.team.inactive}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TeamPage() {
  return (
    <I18nProvider>
      <TeamInner />
    </I18nProvider>
  )
}
