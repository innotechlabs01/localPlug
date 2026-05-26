'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import type { Reservation } from '@/lib/reservations-types'
import { formatDateShort } from '@/lib/date-utils'

interface ReservationTableProps {
  reservations: Reservation[]
  onViewReservation: (reservation: Reservation) => void
}

export default function ReservationTable({ reservations, onViewReservation }: ReservationTableProps) {
  const { t } = useI18n()
  const labels = t.admin?.reservations || {}

  const [flags, setFlags] = useState<Record<string, string>>({
    Argentina: '🇦🇷', USA: '🇺🇸', Spain: '🇪🇸', Mexico: '🇲🇽',
    UK: '🇬🇧', France: '🇫🇷', Colombia: '🇨🇴', Brazil: '🇧🇷',
    Chile: '🇨🇱', Peru: '🇵🇪', Ecuador: '🇪🇨', Canada: '🇨🇦',
    Germany: '🇩🇪', Italy: '🇮🇹', Portugal: '🇵🇹', Australia: '🇦🇺', Sweden: '🇸🇪',
  })

  useEffect(() => {
    fetch('/api/admin/lookup')
      .then(res => res.json())
      .then((data: any) => {
        if (data.countries) {
          const map: Record<string, string> = {}
          data.countries.forEach((c: { name: string; flag: string }) => { map[c.name] = c.flag })
          setFlags(prev => ({ ...prev, ...map }))
        }
      })
      .catch(() => {})
  }, [])

  if (reservations.length === 0) {
    return <div className="text-center py-12 text-[13px] text-[var(--fg-muted)]">{labels.noReservations || 'No reservations found'}</div>
  }

  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="border-b border-[var(--border)]">
          <th className="text-left px-4 py-2.5 font-medium text-[var(--fg-muted)]">{labels.guest || 'Guest'}</th>
          <th className="text-left px-4 py-2.5 font-medium text-[var(--fg-muted)]">{labels.country || 'Country'}</th>
          <th className="text-left px-4 py-2.5 font-medium text-[var(--fg-muted)]">{labels.package || 'Package'}</th>
          <th className="text-left px-4 py-2.5 font-medium text-[var(--fg-muted)]">{labels.arrival || 'Arrival'}</th>
          <th className="text-left px-4 py-2.5 font-medium text-[var(--fg-muted)]">{labels.flight || 'Flight'}</th>
          <th className="text-left px-4 py-2.5 font-medium text-[var(--fg-muted)]">{labels.status || 'Status'}</th>
          <th className="text-left px-4 py-2.5 font-medium text-[var(--fg-muted)]">{labels.payment || 'Payment'}</th>
          <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border-light)]">
        {reservations.map(r => (
          <tr key={r.id} className="hover:bg-[var(--surface-hover)] cursor-pointer" onClick={() => onViewReservation(r)}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: getAvatarColor(r.guest.firstName.charAt(0)) }}>
                  {r.guest.firstName.charAt(0)}{r.guest.lastName.charAt(0)}
                </div>
                <span className="font-medium" style={{ color: 'var(--fg)' }}>{r.guest.firstName} {r.guest.lastName}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-[var(--fg-secondary)]">
              <span className="mr-1.5">{flags[r.guest.country || ''] || '🌍'}</span>
              {r.guest.country || 'Unknown'}
            </td>
            <td className="px-4 py-3 text-[var(--fg-secondary)]">{r.service.name}</td>
            <td className="px-4 py-3 text-[var(--fg-secondary)] font-mono">{formatDate(r.arrivalDate)} {r.arrivalTime?.substring(0, 5) || ''}</td>
            <td className="px-4 py-3 text-[var(--fg-secondary)] font-mono">{r.flightInfo || '—'}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(r.status)}`}>{getStatusText(r.status)}</span>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getPaymentBadgeClass(r.paymentStatus)}`}>{getPaymentText(r.paymentStatus)}</span>
            </td>
            <td className="px-4 py-3">
              <button className="p-1.5 rounded hover:bg-[var(--surface-active)] text-[var(--fg-muted)] hover:text-[var(--accent)]" onClick={e => { e.stopPropagation(); onViewReservation(r) }} title="View details">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function getStatusText(status: string): string {
  const map: Record<string, string> = { pending: 'Pending', confirmed: 'Confirmed', awaiting_payment: 'Awaiting', assigned: 'Assigned', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }
  return map[status] || 'Unknown'
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-[rgba(250,204,21,0.15)] text-yellow-400',
    confirmed: 'bg-[rgba(74,222,128,0.15)] text-green-400',
    awaiting_payment: 'bg-[rgba(96,165,250,0.15)] text-blue-400',
    assigned: 'bg-[rgba(167,139,250,0.15)] text-purple-400',
    in_progress: 'bg-[rgba(99,102,241,0.15)] text-indigo-400',
    completed: 'bg-[var(--surface-hover)] text-[var(--fg-secondary)]',
    cancelled: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  }
  return map[status] || 'bg-[var(--surface-hover)] text-[var(--fg-muted)]'
}

function getPaymentText(status: string): string {
  const map: Record<string, string> = { pending: 'Pending', paid: 'Paid', partial: 'Partial', refunded: 'Refunded' }
  return map[status] || 'Unknown'
}

function getPaymentBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-[rgba(250,204,21,0.15)] text-yellow-400',
    paid: 'bg-[rgba(74,222,128,0.15)] text-green-400',
    partial: 'bg-[rgba(96,165,250,0.15)] text-blue-400',
    refunded: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  }
  return map[status] || 'bg-[var(--surface-hover)] text-[var(--fg-muted)]'
}

function getAvatarColor(letter: string): string {
  const colors = ['var(--warning)', 'var(--accent)', 'var(--info)', '#8b5cf6', '#14b8a6', '#64748b', 'var(--danger)', '#f97316', '#84cc16', '#06b6d4']
  return colors[letter.charCodeAt(0) % colors.length]
}

function formatDate(dateStr: string): string {
  return formatDateShort(dateStr)
}
