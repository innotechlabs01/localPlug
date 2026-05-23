import type { Reservation, ReservationStatus, PaymentStatus, VIPStatus, DriverInfo } from './reservations-types';
export type { Reservation, ReservationStatus, PaymentStatus, VIPStatus, DriverInfo };

// Mock data for development - in production this would call actual APIs
const mockReservations: Reservation[] = [
  {
    id: '1',
    guest: {
      id: 'g1',
      firstName: 'Sofía',
      lastName: 'Martínez',
      email: 'sofia.m@email.com',
      phone: '+54 911 555-1234',
      country: 'Argentina',
      language: 'Spanish, English'
    },
    service: {
      id: 's1',
      name: 'Premium City Tour',
      description: 'Comprehensive city tour with private guide'
    },
    arrivalDate: '2026-05-21',
    arrivalTime: '14:30',
    flightInfo: 'AV124 — Arriving 14:30',
    status: 'confirmed',
    paymentStatus: 'paid',
    totalAmount: 285,
    paymentMethod: 'Visa •••• 4242',
    transactionId: 'TXN-MDE-2024-8392',
    specialRequests: 'English-speaking guide requested',
    vipStatus: 'gold',
    createdAt: '2026-05-20T10:23:00Z',
    updatedAt: '2026-05-20T10:23:00Z'
  },
  {
    id: '2',
    guest: {
      id: 'g2',
      firstName: 'James',
      lastName: 'Rodriguez',
      email: 'james.r@email.com',
      phone: '+1 305 555-6789',
      country: 'USA',
      language: 'English'
    },
    service: {
      id: 's2',
      name: 'Business Express',
      description: 'Efficient transfer for business travelers'
    },
    arrivalDate: '2026-05-21',
    arrivalTime: '15:45',
    flightInfo: 'AA988 — Arriving 15:45',
    status: 'assigned',
    paymentStatus: 'paid',
    totalAmount: 180,
    paymentMethod: 'Amex •••• 1001',
    transactionId: 'TXN-MDE-2024-8395',
    specialRequests: '',
    vipStatus: 'none',
    createdAt: '2026-05-20T09:15:00Z',
    updatedAt: '2026-05-20T09:15:00Z'
  },
  {
    id: '3',
    guest: {
      id: 'g3',
      firstName: 'Camila',
      lastName: 'López',
      email: 'camila.l@email.com',
      phone: '+52 81 555-7890',
      country: 'Mexico',
      language: 'Spanish'
    },
    service: {
      id: 's3',
      name: 'Guatapé Adventure',
      description: 'Full-day excursion to Guatapé and El Peñol'
    },
    arrivalDate: '2026-05-21',
    arrivalTime: '09:00',
    flightInfo: 'MX432 — Arriving 09:00',
    status: 'in_progress',
    paymentStatus: 'paid',
    totalAmount: 320,
    paymentMethod: 'Mastercard •••• 7789',
    transactionId: 'TXN-MDE-2024-8398',
    specialRequests: '',
    vipStatus: 'none',
    createdAt: '2026-05-20T08:00:00Z',
    updatedAt: '2026-05-20T08:00:00Z'
  },
  {
    id: '4',
    guest: {
      id: 'g4',
      firstName: 'Pedro',
      lastName: 'Gómez',
      email: 'pedro.g@email.com',
      phone: '+57 310 555-4321',
      country: 'Colombia',
      language: 'Spanish'
    },
    service: {
      id: 's4',
      name: 'Medellín City Pass',
      description: 'Access to top attractions in Medellín'
    },
    arrivalDate: '2026-05-21',
    arrivalTime: '18:00',
    flightInfo: 'LA567 — Arriving 18:00',
    status: 'pending',
    paymentStatus: 'pending',
    totalAmount: 95,
    paymentMethod: undefined,
    transactionId: undefined,
    specialRequests: '',
    vipStatus: 'none',
    createdAt: '2026-05-20T16:30:00Z',
    updatedAt: '2026-05-20T16:30:00Z'
  },
  {
    id: '5',
    guest: {
      id: 'g5',
      firstName: 'Emma',
      lastName: 'Karlsson',
      email: 'emma.k@email.com',
      phone: '+46 70 555-9876',
      country: 'Sweden',
      language: 'Swedish, English'
    },
    service: {
      id: 's5',
      name: 'Luxury Coffee Tour',
      description: 'Specialty coffee farm tour with tasting'
    },
    arrivalDate: '2026-05-21',
    arrivalTime: '16:20',
    flightInfo: 'SK891 — Arriving 16:20',
    status: 'awaiting_payment',
    paymentStatus: 'pending',
    totalAmount: 150,
    paymentMethod: undefined,
    transactionId: undefined,
    specialRequests: '',
    vipStatus: 'gold',
    createdAt: '2026-05-20T15:45:00Z',
    updatedAt: '2026-05-20T15:45:00Z'
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchReservations(): Promise<Reservation[]> {
  // Simulate network delay
  await delay(500)
  
  // In a real application, this would be:
  // const response = await fetch('/api/reservations')
  // return response.json()
  
  return mockReservations
}

export async function fetchReservationById(id: string): Promise<Reservation | null> {
  await delay(300)
  const reservation = mockReservations.find(r => r.id === id)
  return reservation || null
}

// These would be implemented with actual API calls in production
export async function assignDriverToReservation(reservationId: string, driverId: string): Promise<void> {
  const response = await fetch(`/api/admin/reservations/${reservationId}/assign-driver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId })
  })
  if (!response.ok) throw new Error('Failed to assign driver')
}

export async function sendWhatsAppMessage(reservationId: string, driverId?: string, driverName?: string, driverPhone?: string): Promise<void> {
  const response = await fetch(`/api/admin/reservations/${reservationId}/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId, driverName, driverPhone })
  })
  if (!response.ok) throw new Error('Failed to send WhatsApp')
}

export async function cancelReservation(reservationId: string): Promise<void> {
  const response = await fetch(`/api/admin/reservations/${reservationId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!response.ok) throw new Error('Failed to cancel reservation')
}
