'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

const today = new Date()
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayStr = fmt(today)

interface DateFilterState {
  dateFrom: string
  dateTo: string
  label: string
}

interface DateFilterContextValue extends DateFilterState {
  setDateRange: (from: string, to: string, label?: string) => void
}

const DateFilterContext = createContext<DateFilterContextValue>({
  dateFrom: todayStr,
  dateTo: todayStr,
  label: '',
  setDateRange: () => {},
})

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DateFilterState>({ dateFrom: todayStr, dateTo: todayStr, label: '' })

  const setDateRange = useCallback((from: string, to: string, label?: string) => {
    setState({ dateFrom: from, dateTo: to, label: label || '' })
  }, [])

  return (
    <DateFilterContext.Provider value={{ ...state, setDateRange }}>
      {children}
    </DateFilterContext.Provider>
  )
}

export function useDateFilter() {
  return useContext(DateFilterContext)
}
