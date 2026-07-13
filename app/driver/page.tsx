'use client'

import { useState, useEffect, useCallback } from 'react'

interface Driver {
  id: number
  name: string
  phone: string
  vehicle: string
  plate: string
  status: string
  photo_url: string | null
}

interface Assignment {
  id: number
  order_id: number
  driver_id: number
  status: string
  vehicle_type: string | null
  pickup_date: string | null
  pickup_time: string | null
  observations: string | null
  created_at: string
  order_number: string | null
  booking_reference: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  package_name: string | null
  flight_number: string | null
  arrival_date: string | null
  arrival_time: string | null
  destination_address: string | null
  airline: string | null
}

type Tab = 'pending' | 'active' | 'history'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  offered: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  expired: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

export default function DriverPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('selectedDriverId')
    if (saved) setSelectedDriverId(Number(saved))
  }, [])

  useEffect(() => {
    fetch('/api/driver/list')
      .then(r => r.json())
      .then(data => {
        setDrivers(data.drivers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const fetchAssignments = useCallback(async () => {
    if (!selectedDriverId) return
    try {
      const res = await fetch(`/api/driver/my-assignments?driverId=${selectedDriverId}`)
      const data = await res.json()
      setAssignments(data.assignments || [])
    } catch (err) {
      console.error('Failed to fetch assignments', err)
    }
  }, [selectedDriverId])

  useEffect(() => {
    fetchAssignments()
    const interval = setInterval(fetchAssignments, 30000)
    return () => clearInterval(interval)
  }, [fetchAssignments])

  const handleSelectDriver = (id: number) => {
    setSelectedDriverId(id)
    localStorage.setItem('selectedDriverId', String(id))
  }

  const handleAction = async (assignmentId: number, action: 'accept' | 'decline') => {
    setActionLoading(assignmentId)
    try {
      const endpoint = action === 'accept'
        ? `/api/assignments/${assignmentId}/accept`
        : `/api/assignments/${assignmentId}/decline`
      await fetch(endpoint, { method: 'POST' })
      await fetchAssignments()
    } catch (err) {
      console.error(`Failed to ${action}`, err)
    } finally {
      setActionLoading(null)
    }
  }

  const selectedDriver = drivers.find(d => d.id === selectedDriverId)

  const filteredAssignments = assignments.filter(a => {
    if (activeTab === 'pending') return ['pending', 'offered'].includes(a.status)
    if (activeTab === 'active') return ['confirmed'].includes(a.status)
    return ['completed', 'cancelled', 'expired'].includes(a.status)
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c8a962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-[#c8a962] mb-6">
          Driver Portal
        </h1>

        {!selectedDriverId ? (
          <div>
            <h2 className="text-lg mb-4 text-gray-300">Select your name:</h2>
            <div className="grid gap-3">
              {drivers.map(driver => (
                <button
                  key={driver.id}
                  onClick={() => handleSelectDriver(driver.id)}
                  className="w-full text-left p-4 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] hover:border-[#c8a962] transition-colors"
                >
                  <div className="font-semibold">{driver.name}</div>
                  <div className="text-sm text-gray-400">
                    {driver.vehicle} — {driver.plate}
                  </div>
                </button>
              ))}
              {drivers.length === 0 && (
                <p className="text-gray-500">No drivers found in the system.</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-400">Logged in as</p>
                <p className="font-semibold text-lg">{selectedDriver?.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedDriver?.vehicle} — {selectedDriver?.plate}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedDriverId(null)
                  localStorage.removeItem('selectedDriverId')
                }}
                className="text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-1 rounded"
              >
                Switch Driver
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              {(['pending', 'active', 'history'] as Tab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-[#c8a962] text-black'
                      : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'pending' && filteredAssignments.length > 0 && activeTab !== 'pending' && ''}
                </button>
              ))}
            </div>

            {activeTab === 'pending' && filteredAssignments.length > 0 && (
              <div className="mb-4 text-sm text-gray-400">
                {filteredAssignments.length} assignment(s) waiting
              </div>
            )}

            <div className="space-y-3">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No {activeTab} assignments
                </div>
              ) : (
                filteredAssignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[assignment.status] || 'bg-gray-500/20 text-gray-400'}`}>
                          {assignment.status}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          #{assignment.order_number || assignment.id}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(assignment.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                      {assignment.customer_name && (
                        <div>
                          <span className="text-gray-500">Client:</span>{' '}
                          {assignment.customer_name}
                        </div>
                      )}
                      {assignment.customer_phone && (
                        <div>
                          <span className="text-gray-500">Phone:</span>{' '}
                          {assignment.customer_phone}
                        </div>
                      )}
                      {assignment.flight_number && (
                        <div>
                          <span className="text-gray-500">Flight:</span>{' '}
                          {assignment.airline} {assignment.flight_number}
                        </div>
                      )}
                      {assignment.arrival_date && (
                        <div>
                          <span className="text-gray-500">Arrival:</span>{' '}
                          {assignment.arrival_date} {assignment.arrival_time}
                        </div>
                      )}
                      {assignment.destination_address && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Destination:</span>{' '}
                          {assignment.destination_address}
                        </div>
                      )}
                      {assignment.package_name && (
                        <div>
                          <span className="text-gray-500">Package:</span>{' '}
                          {assignment.package_name}
                        </div>
                      )}
                    </div>

                    {assignment.observations && (
                      <div className="mt-2 text-sm text-gray-400 italic">
                        Notes: {assignment.observations}
                      </div>
                    )}

                    {['pending', 'offered'].includes(assignment.status) && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleAction(assignment.id, 'accept')}
                          disabled={actionLoading === assignment.id}
                          className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm disabled:opacity-50"
                        >
                          {actionLoading === assignment.id ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleAction(assignment.id, 'decline')}
                          disabled={actionLoading === assignment.id}
                          className="flex-1 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 font-medium text-sm disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
