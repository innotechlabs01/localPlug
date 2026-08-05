'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { COUNTRY_DIAL_CODES, formatPhoneValue, type CountryDialCode } from './lib/country-dial-codes'

interface LookupCountry {
  code: string
  name: string
  flag: string
}

interface PhoneInputWithCountryProps {
  value: string
  onChange: (value: string) => void
  countryCode: string
  onCountryCodeChange: (code: string) => void
  countries: LookupCountry[]
  placeholder?: string
  hint?: string
}

function findCountryByCode(
  code: string,
  merged: CountryDialCode[],
): CountryDialCode | undefined {
  return merged.find((c) => c.code === code)
}

function parsePhoneValue(
  value: string,
  merged: CountryDialCode[],
): { country: CountryDialCode | undefined; localNumber: string } {
  if (!value) return { country: undefined, localNumber: '' }
  for (const c of merged) {
    const prefix = `+${c.dialCode}`
    if (value.startsWith(prefix)) {
      return { country: c, localNumber: value.slice(prefix.length) }
    }
  }
  return { country: undefined, localNumber: value.replace(/^\+/, '') }
}

export default function PhoneInputWithCountry({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  countries,
  placeholder,
  hint,
}: PhoneInputWithCountryProps) {
  const merged = useMemo(() => {
    const seen = new Set<string>()
    const result: CountryDialCode[] = []
    for (const api of countries) {
      const dial = COUNTRY_DIAL_CODES.find((d) => d.code === api.code)
      if (dial && !seen.has(api.code)) {
        seen.add(api.code)
        result.push({ ...dial, name: api.name, flag: api.flag })
      }
    }
    for (const d of COUNTRY_DIAL_CODES) {
      if (!seen.has(d.code)) {
        seen.add(d.code)
        result.push(d)
      }
    }
    return result
  }, [countries])

  const parsed = useMemo(() => parsePhoneValue(value, merged), [value, merged])
  const initialCountry = useMemo(() => {
    const currentCode = countryCode
    if (currentCode) {
      const c = findCountryByCode(currentCode, merged)
      if (c) return c
    }
    return parsed.country
  }, [])

  const [selected, setSelected] = useState<CountryDialCode>(
    initialCountry ?? merged[0] ?? COUNTRY_DIAL_CODES[0],
  )
  const [localNumber, setLocalNumber] = useState(parsed.localNumber)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!countryCode) return
    const c = findCountryByCode(countryCode, merged)
    if (c && c.code !== selected.code) {
      setSelected(c)
    }
  }, [countryCode, merged])

  useEffect(() => {
    const p = parsePhoneValue(value, merged)
    if (p.country && p.country.code !== selected.code) {
      setSelected(p.country)
    }
    if (p.localNumber !== localNumber) {
      setLocalNumber(p.localNumber)
    }
  }, [value, merged])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = useMemo(() => {
    if (!search) return merged
    const q = search.toLowerCase()
    return merged.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    )
  }, [merged, search])

  const emitChange = useCallback(
    (country: CountryDialCode, number: string) => {
      const combined = formatPhoneValue(country.dialCode, number)
      onChange(combined)
      if (onCountryCodeChange) {
        onCountryCodeChange(country.code)
      }
    },
    [onChange, onCountryCodeChange],
  )

  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '')
      setLocalNumber(digits)
      emitChange(selected, digits)
    },
    [selected, emitChange],
  )

  const handleSelectCountry = useCallback(
    (country: CountryDialCode) => {
      setSelected(country)
      setOpen(false)
      setSearch('')
      emitChange(country, localNumber)
      inputRef.current?.focus()
    },
    [localNumber, emitChange],
  )

  return (
    <div>
      <label className="block text-label-md text-[var(--text-primary)] font-semibold mb-1.5">
        Phone
      </label>
      <div ref={containerRef} className="relative">
        <div className="flex rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] focus-within:ring-2 focus-within:ring-[var(--accent-gold)]/40 focus-within:border-[var(--accent-gold)] transition-all">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 px-3 py-3 bg-[var(--surface)] border-r border-[var(--border)] rounded-l-[var(--radius-md)] text-body-md text-white shrink-0 hover:bg-[var(--border)] transition-colors min-w-[80px]"
          >
            <span className="text-lg leading-none">{selected.flag}</span>
            <span className="text-sm text-[var(--text-secondary)]">+{selected.dialCode}</span>
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            >
              <path d="M1 1l4 4 4-4" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="tel"
            value={localNumber}
            onChange={handleNumberChange}
            placeholder={placeholder || 'Phone number'}
            className="flex-1 px-4 py-3 bg-transparent text-body-md text-white placeholder-[var(--text-muted)] focus:outline-none rounded-r-[var(--radius-md)]"
          />
        </div>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-level-2 max-h-64 overflow-hidden">
            <div className="p-2 border-b border-[var(--border)]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/30"
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-sm text-[var(--text-muted)] text-center">
                  No countries found
                </p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      selected.code === c.code
                        ? 'bg-[var(--accent-gold)]/10 text-white'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-white'
                    }`}
                  >
                    <span className="text-lg leading-none shrink-0">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-[var(--text-muted)] shrink-0">+{c.dialCode}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {hint && (
        <p className="text-sm text-[var(--text-muted)] mt-1">{hint}</p>
      )}
    </div>
  )
}
