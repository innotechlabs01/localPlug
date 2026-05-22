'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import ReservationKPIs from './components/ReservationKPIs'
import ReservationFilters from './components/ReservationFilters'
import ReservationTable from './components/ReservationTable'
import ReservationTimeline from './components/ReservationTimeline'
import ReservationDetailModal from './components/ReservationDetailModal'
import { Reservation, ReservationStatus, fetchReservations } from '@/lib/reservations-api'

export default function AdminReservations() {
  const { t } = useI18n()
  const d = t.admin?.reservations || {}

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<ReservationStatus | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters state
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [flightFilter, setFlightFilter] = useState('')
  const [packageFilter, setPackageFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')

  useEffect(() => {
    loadReservations()
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(loadReservations, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchReservations()
      setReservations(data)
    } catch (err) {
      setError('Failed to load reservations. Please try again.')
      console.error('Error fetching reservations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter reservations based on multiple filters
  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      // Apply status filter
      if (selectedFilter !== 'all' && reservation.status !== selectedFilter) {
        return false
      }
      
      // Apply payment filter
      if (paymentFilter !== 'all' && reservation.paymentStatus !== paymentFilter) {
        return false
      }
      
      // Apply date range filter
      if (dateFrom) {
        const arrival = new Date(reservation.arrivalDate)
        const from = new Date(dateFrom)
        if (arrival < from) return false
      }
      if (dateTo) {
        const arrival = new Date(reservation.arrivalDate)
        const to = new Date(dateTo)
        if (arrival > to) return false
      }
      
      // Apply country filter
      if (countryFilter && reservation.guest.country !== countryFilter) {
        return false
      }
      
      // Apply flight filter
      if (flightFilter) {
        const query = flightFilter.toLowerCase()
        const matchFlight = reservation.flightInfo?.toLowerCase().includes(query)
        if (!matchFlight) return false
      }
      
      // Apply package filter
      if (packageFilter) {
        const query = packageFilter.toLowerCase()
        const matchPkg = reservation.service.name.toLowerCase().includes(query)
        if (!matchPkg) return false
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          reservation.guest.firstName.toLowerCase().includes(query) ||
          reservation.guest.lastName.toLowerCase().includes(query) ||
          reservation.guest.email.toLowerCase().includes(query) ||
          reservation.guest.country?.toLowerCase().includes(query) ||
          reservation.service.name.toLowerCase().includes(query) ||
          reservation.flightInfo?.toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }, [reservations, searchQuery, selectedFilter, dateFrom, dateTo, countryFilter, flightFilter, packageFilter, paymentFilter])

  // Get upcoming arrivals for timeline (next 24 hours)
  const upcomingArrivals = useMemo(() => {
    const now = new Date()
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    return reservations
      .filter(reservation => {
        const arrivalDate = new Date(`${reservation.arrivalDate}T${reservation.arrivalTime || '00:00'}`)
        return arrivalDate >= now && arrivalDate <= next24Hours
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.arrivalDate}T${a.arrivalTime || '00:00'}`)
        const dateB = new Date(`${b.arrivalDate}${b.arrivalTime || '00:00'}`)
        return dateA.getTime() - dateB.getTime()
      })
  }, [reservations])

  const handleOpenModal = useCallback((reservation: Reservation) => {
    setSelectedReservation(reservation)
    setModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setSelectedReservation(null)
  }, [])

  // Action handlers
  const handleSendWhatsApp = useCallback(async () => {
    if (!selectedReservation) return
    try {
      const { sendWhatsAppMessage } = await import('@/lib/reservations-api')
      await sendWhatsAppMessage(selectedReservation.id)
      handleCloseModal()
    } catch (err) {
      console.error('Error sending WhatsApp:', err)
    }
  }, [selectedReservation])

  const handleCancelReservation = useCallback(async () => {
    if (!selectedReservation) return
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return
    
    try {
      const { cancelReservation } = await import('@/lib/reservations-api')
      await cancelReservation(selectedReservation.id)
      setReservations(prev => prev.map(r => 
        r.id === selectedReservation.id ? {...r, status: 'cancelled'} : r
      ))
      handleCloseModal()
    } catch (err) {
      console.error('Error cancelling reservation:', err)
    }
  }, [selectedReservation])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full border-4 border-primary-light border-t-transparent w-12 h-12"></div>
          <span className="ml-4 text-primary-dark">{d.loading || 'Loading reservations...'}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-[200px]">
          <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4 text-red-700 max-w-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {/* Warning icon */}
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.529 0-2.492-1.646-1.742-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/>
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">{d.errorTitle || 'Error loading reservations'}</h3>
                <div className="mt-2 text-sm">{error}</div>
                <div className="mt-4">
                  <button 
                    onClick={loadReservations}
                    className="bg-primary-dark hover:bg-primary-darker text-white font-medium py-1 px-3 rounded"
                  >
                    {d.retry || 'Retry'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar would be handled by layout */}
      <div className="ml-64 transition-all duration-300 ease-in-out">
        <div className="app-layout">
          {/* Topbar would be handled by layout */}
          <div className="main-area">
            <header className="topbar">
              <div className="topbar-left">
                <button 
                  className="icon-btn" 
                  id="menuToggle" 
                  onClick={() => document.getElementById('sidebar')?.classList.toggle('open')}
                  style={{ display: 'none' }} /* Hidden on desktop, shown on mobile */
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
                <span className="page-title">{d.pageTitle || 'Reservations'}</span>
                <span className="badge badge-accent" style={{ fontSize: '10px' }}>{d.live || 'Live'}</span>
              </div>
              <div className="topbar-right">
                <div className="search-input" style={{ width: '200px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder={d.searchPlaceholder || 'Search reservations...'} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input"
                  />
                </div>
                <select 
                  className="input" 
                  style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                >
                  <option>🇺🇸 EN</option>
                  <option>🇪🇸 ES</option>
                </select>
                <button 
                  className="icon-btn" 
                  onClick={() => {/* showToast('Notifications (5 unread)') */}}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <span className="dot"></span>
                </button>
                <div 
                  className="avatar" 
                  onClick={() => {/* showToast('Admin · Profile settings') */}}
                >
                  JD
                </div>
              </div>
            </header>

            <div className="content">
              <div className="reservations-page">
                
                {/* KPI Row */}
                <ReservationKPIs reservations={reservations} />
                
                {/* Advanced Filters */}
                <div className="filters-bar">
                  <div className="filter-group">
                    <label>{d.dateFrom || 'From Date'}</label>
                    <input 
                      type="date" 
                      className="input"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>{d.dateTo || 'To Date'}</label>
                    <input 
                      type="date" 
                      className="input"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>{d.country || 'Country'}</label>
                    <select 
                      className="input"
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Argentina">Argentina</option>
                      <option value="USA">USA</option>
                      <option value="Spain">Spain</option>
                      <option value="Mexico">Mexico</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Chile">Chile</option>
                      <option value="UK">UK</option>
                      <option value="France">France</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>{d.flight || 'Flight'}</label>
                    <input 
                      type="text" 
                      className="input"
                      placeholder={d.searchFlight || 'Search flight...'}
                      value={flightFilter}
                      onChange={(e) => setFlightFilter(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>{d.package || 'Package'}</label>
                    <input 
                      type="text" 
                      className="input"
                      placeholder={d.searchPackage || 'Search package...'}
                      value={packageFilter}
                      onChange={(e) => setPackageFilter(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>{d.payment || 'Payment'}</label>
                    <select 
                      className="input"
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                    >
                      <option value="all">{d.filters?.all || 'All'}</option>
                      <option value="pending">{d.filters?.pending || 'Pending'}</option>
                      <option value="paid">{d.paymentStatus || 'Paid'}</option>
                      <option value="partial">{d.partial || 'Partial'}</option>
                      <option value="refunded">{d.refunded || 'Refunded'}</option>
                    </select>
                  </div>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setDateFrom('')
                      setDateTo('')
                      setCountryFilter('')
                      setFlightFilter('')
                      setPackageFilter('')
                      setPaymentFilter('all')
                    }}
                  >
                    {d.clearFilters || 'Clear'}
                  </button>
                </div>
                
                {/* Status Filter Tabs */}
                <ReservationFilters 
                  selectedFilter={selectedFilter}
                  onFilterChange={setSelectedFilter}
                  reservations={reservations}
                />
                
                {/* Table + Timeline */}
                <div className="res-table-section">
                  <div className="res-table-card">
                    <div className="card-header">
                      <div className="flex items-center justify-between">
                        <span className="card-title">{d.allReservations || 'All Reservations'}</span>
                        <div className="flex items-center gap-3">
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => {/* showToast('Export CSV') */}}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            {d.export_ || 'Export'}
                          </button>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => {/* showToast('New Reservation') */}}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            {d.newReservation || 'New'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="table-wrap">
                      <ReservationTable 
                        reservations={filteredReservations} 
                        onViewReservation={handleOpenModal}
                      />
                    </div>
                  </div>
                  
                  {/* Timeline */}
                  <div className="timeline-card">
                    <div className="card-header">
                      <div className="flex items-center justify-between">
                        <span className="card-title">{d.upcomingArrivals || 'Upcoming Arrivals'}</span>
                        <span className="badge badge-accent" style={{ fontSize: '10px' }}>
                          {upcomingArrivals.length} {d.todayLabel || 'Today'}
                        </span>
                      </div>
                    </div>
                    <div className="timeline-list">
                      {upcomingArrivals.length > 0 ? (
                        upcomingArrivals.map((reservation, index) => (
                          <div key={reservation.id} className="timeline-item">
                            <div className="timeline-line">
                              <div 
                                className={`timeline-dot ${getStatusClass(reservation.status)}`} 
                              />
                            </div>
                            <div className="timeline-body">
                              <div className="timeline-time">
                                {formatTime(reservation.arrivalTime)} — {getStatusText(reservation.status)}
                              </div>
                              <div className="timeline-guest">
                                {reservation.guest.firstName} {reservation.guest.lastName}
                              </div>
                              <div className="timeline-meta">
                                <span className="badge badge-info" style={{ fontSize: '10px' }}>
                                  {reservation.flightInfo || ''}
                                </span> {reservation.service.name}
                              </div>
                            </div>
                            <div className="timeline-right">
                              <span 
                                className={`status-badge ${getStatusBadgeClass(reservation.status)}`} 
                                style={{ fontSize: '10px' }}
                              >
                                {getStatusText(reservation.status)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted">
                          {d.noUpcomingArrivals || 'No upcoming arrivals'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Detail Modal */}
                <ReservationDetailModal
                  open={modalOpen}
                  reservation={selectedReservation}
                  onClose={handleCloseModal}
                  onSendWhatsApp={handleSendWhatsApp}
                  onCancelReservation={handleCancelReservation}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'pending',
    confirmed: 'confirmed',
    awaiting_payment: 'awaiting',
    assigned: 'assigned',
    in_progress: 'in-progress',
    completed: 'completed',
    cancelled: 'cancelled'
  }
  return statusMap[status] || 'pending'
}

function getStatusBadgeClass(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'pending',
    confirmed: 'confirmed',
    awaiting_payment: 'awaiting',
    assigned: 'assigned',
    in_progress: 'in-progress',
    completed: 'completed',
    cancelled: 'cancelled'
  }
  return statusMap[status] || 'pending'
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    awaiting_payment: 'Awaiting Payment',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return statusMap[status] || 'Unknown'
}

function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return '--:--'
  return timeStr.substring(0, 5) // Ensure HH:MM format
}