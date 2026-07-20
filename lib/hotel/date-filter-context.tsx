'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

const today = new Date()
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayStr = fmt(today)

interface HotelDateFilterState {
  dateFrom: string
  dateTo: string
  label: string
}

interface HotelDateFilterContextValue extends HotelDateFilterState {
  setDateRange: (from: string, to: string, label?: string) => void
}

const HotelDateFilterContext = createContext<HotelDateFilterContextValue>({
  dateFrom: todayStr,
  dateTo: todayStr,
  label: '',
  setDateRange: () => {},
})

export function HotelDateFilterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HotelDateFilterState>({ dateFrom: todayStr, dateTo: todayStr, label: '' })

  const setDateRange = useCallback((from: string, to: string, label?: string) => {
    setState({ dateFrom: from, dateTo: to, label: label || '' })
  }, [])

  return (
    <HotelDateFilterContext.Provider value={{ ...state, setDateRange }}>
      {children}
    </HotelDateFilterContext.Provider>
  )
}

export function useHotelDateFilter() {
  return useContext(HotelDateFilterContext)
}
