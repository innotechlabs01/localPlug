'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import { Reservation } from '@/lib/reservations-api'

interface ReservationTableProps {
  reservations: Reservation[]
  onViewReservation: (reservation: Reservation) => void
}

export default function ReservationTable({ 
  reservations, 
  onViewReservation 
}: ReservationTableProps) {
  const { t } = useI18n()
  const labels = t.admin?.reservations || {}

  const [flags, setFlags] = useState<Record<string, string>>({
    Argentina: '🇦🇷', USA: '🇺🇸', Spain: '🇪🇸', Mexico: '🇲🇽',
    UK: '🇬🇧', France: '🇫🇷', Colombia: '🇨🇴', Brazil: '🇧🇷',
    Chile: '🇨🇱', Peru: '🇵🇪', Ecuador: '🇪🇨', Canada: '🇨🇦',
    Germany: '🇩🇪', Italy: '🇮🇹', Portugal: '🇵🇹', Australia: '🇦🇺',
    Sweden: '🇸🇪',
  })

  useEffect(() => {
    fetch('/api/admin/lookup')
      .then(res => res.json())
      .then((data: any) => {
        if (data.countries) {
          const map: Record<string, string> = {}
          data.countries.forEach((c: { name: string; flag: string }) => {
            map[c.name] = c.flag
          })
          setFlags(prev => ({ ...prev, ...map }))
        }
      })
      .catch(() => {})
  }, [])
  if (reservations.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        {labels.noReservations || 'No reservations found'}
      </div>
    )
  }

  return (
    <table id="reservationsTable" className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t.admin.reservations.guest || 'Guest'}
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t.admin.reservations.country || 'Country'}
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t.admin.reservations.package || 'Package'}
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t.admin.reservations.arrival || 'Arrival'}
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t.admin.reservations.flight || 'Flight'}
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t.admin.reservations.status || 'Status'}
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t.admin.reservations.payment || 'Payment'}
          </th>
          <th scope="col" className="relative px-6 py-3">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {reservations.map(reservation => {
          const statusClass = getStatusClass(reservation.status)
          const paymentClass = getPaymentClass(reservation.paymentStatus)
          return (
            <tr 
              key={reservation.id} 
              className="bg-white hover:bg-gray-50"
              data-status={reservation.status}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  <div 
                    className="guest-avatar" 
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: getAvatarColor(reservation.guest.firstName.charAt(0)),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '600',
                      flexShrink: '0',
                      borderRadius: '50%'
                    }}
                  >
                    {reservation.guest.firstName.charAt(0)}{reservation.guest.lastName.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium">{reservation.guest.firstName} {reservation.guest.lastName}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="country-flag mr-2">{flags[reservation.guest.country || ''] || '🌍'}</span>
                  {reservation.guest.country || (t.admin.reservations.unknown || 'Unknown')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {reservation.service.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(reservation.arrivalDate)} {formatTime(reservation.arrivalTime)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {reservation.flightInfo || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span 
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}
                >
                  {getStatusText(reservation.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span 
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentClass}`}
                >
                  {getPaymentText(reservation.paymentStatus)}
                </span>
              </td>
              <td className="relative px-6 py-4">
                <div className="flex items-center space-x-2">
                  <button 
                    className="action-btn view"
                    onClick={() => onViewReservation(reservation)}
                    title="View"
                    aria-label="View reservation details"
                  >
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      className="lucide lucide-eye"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button 
                    className="action-btn whatsapp"
                    title="WhatsApp"
                    aria-label="Send WhatsApp message"
                  >
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      className="lucide lucide-message-circle"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                  </button>
                  <button 
                    className="action-btn more"
                    title="More actions"
                    aria-label="More actions"
                  >
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      className="lucide lucide-ellipsis-vertical"
                    >
                      <circle cx="12" cy="12" r="1"/>
                      <circle cx="12" cy="5" r="1"/>
                      <circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    awaiting_payment: 'bg-blue-100 text-blue-800',
    assigned: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function getPaymentClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-blue-100 text-blue-800',
    refunded: 'bg-red-100 text-red-800'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    awaiting_payment: 'Awaiting',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return map[status] || 'Unknown'
}

function getPaymentText(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    partial: 'Partial',
    refunded: 'Refunded'
  }
  return map[status] || 'Unknown'
}

function getAvatarColor(letter: string): string {
  const hash = letter.charCodeAt(0)
  const colors = [
    '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
    '#14b8a6', '#64748b', '#ef4450', '#f97316', '#84cc16', '#06b6d4'
  ]
  return colors[hash % colors.length]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return '--:--'
  return timeStr.substring(0, 5)
}