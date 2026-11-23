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
    <table>
      <thead>
        <tr>
          <th>{labels.guest || 'Guest'}</th>
          <th>{labels.country || 'Country'}</th>
          <th>{labels.package || 'Package'}</th>
          <th>{labels.arrival || 'Arrival'}</th>
          <th>{labels.flight || 'Flight'}</th>
          <th>{labels.status || 'Status'}</th>
          <th>{(labels as any).amount || 'Amount'}</th>
                <th>{(labels as any).transactionId || 'Txn ID'}</th>
                <th>{labels.payment || 'Payment'}</th>
          <th style={{ width: 80 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reservations.map(r => (
          <tr key={r.id} onClick={() => onViewReservation(r)}>
            <td>
              <div className="guest-cell">
                <div className="guest-avatar" style={{ background: getAvatarColor(r.guest.firstName.charAt(0)), color: 'white' }}>
                  {r.guest.firstName.charAt(0)}{r.guest.lastName.charAt(0)}
                </div>
                {r.guest.firstName} {r.guest.lastName}
              </div>
            </td>
            <td>
              <span className="country-flag">{flags[r.guest.country || ''] || '🌍'}</span>
              {r.guest.country || 'Unknown'}
            </td>
            <td>{r.service.name}</td>
            <td style={{ fontFamily: 'var(--font-mono)' }}>{formatDate(r.arrivalDate)} {r.arrivalTime?.substring(0, 5) || ''}</td>
            <td style={{ fontFamily: 'var(--font-mono)' }}>{r.flightInfo || '—'}</td>
<td>
  <span className={`status-badge ${getStatusBadgeClass(r.status)}`}>{getStatusText(r.status)}</span>
</td>
<td>{r.totalAmount !== undefined ? `$${r.totalAmount.toFixed(2)}` : '—'}</td>
<td>{r.transactionId || '—'}</td>
<td>
  <span className={`payment-badge ${getPaymentBadgeClass(r.paymentStatus)}`}>{getPaymentText(r.paymentStatus)}</span>
</td>
            <td>
              <div className="action-btn-group">
                <button className="action-btn view" onClick={e => { e.stopPropagation(); onViewReservation(r) }} title="View details">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button className="action-btn whatsapp" onClick={e => { e.stopPropagation(); onViewReservation(r) }} title="WhatsApp">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </button>
                <button className="action-btn more" onClick={e => { e.stopPropagation(); onViewReservation(r) }} title="More">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </button>
              </div>
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
    pending: 'pending',
    confirmed: 'confirmed',
    awaiting_payment: 'awaiting',
    assigned: 'assigned',
    in_progress: 'in-progress',
    completed: 'completed',
    cancelled: 'cancelled',
  }
  return map[status] || 'pending'
}

function getPaymentText(status: string): string {
  const map: Record<string, string> = { pending: 'Pending', paid: 'Paid', partial: 'Partial', refunded: 'Refunded' }
  return map[status] || 'Unknown'
}

function getPaymentBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'pending',
    paid: 'paid',
    partial: 'partial',
    refunded: 'refunded',
  }
  return map[status] || 'pending'
}

function getAvatarColor(letter: string): string {
  const colors = ['var(--warning)', 'var(--accent)', 'var(--info)', '#8b5cf6', '#14b8a6', '#64748b', 'var(--danger)', '#f97316', '#84cc16', '#06b6d4']
  return colors[letter.charCodeAt(0) % colors.length]
}

function formatDate(dateStr: string): string {
  return formatDateShort(dateStr)
}
