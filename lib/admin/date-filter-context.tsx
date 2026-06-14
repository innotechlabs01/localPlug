'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface DateFilterState {
  dateFrom: string
  dateTo: string
  label: string
}

interface DateFilterContextValue extends DateFilterState {
  setDateRange: (from: string, to: string, label?: string) => void
}

const DateFilterContext = createContext<DateFilterContextValue>({
  dateFrom: '',
  dateTo: '',
  label: '',
  setDateRange: () => {},
})

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DateFilterState>({ dateFrom: '', dateTo: '', label: '' })

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
