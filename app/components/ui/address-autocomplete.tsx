'use client'

import { useEffect, useId, useRef, useState } from 'react'

export interface AddressSuggestion {
  id: string
  label: string
  detail: string
  lat: number
  lng: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: AddressSuggestion | null) => void
  placeholder: string
  className?: string
  inputClassName?: string
  'aria-label'?: string
}

/**
 * Google-Maps-style address filter backed by the local Nominatim proxy.
 * Typing filters suggestions; selecting one stores its coordinates so the map
 * and checkout use the exact place instead of a free-text guess.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className = '',
  inputClassName = '',
  'aria-label': ariaLabel,
}: AddressAutocompleteProps) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedLabelRef = useRef<string | null>(null)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlighted, setHighlighted] = useState(0)

  useEffect(() => {
    const query = value.trim()
    if (query.length < 3) {
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }

    // Selecting a suggestion writes its label back into the input; that is not
    // a new search and must not reopen the list we just closed.
    if (value === selectedLabelRef.current) {
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }

    let cancelled = false
    setSuggestions([])
    setOpen(false)
    setLoading(true)
    const timer = window.setTimeout(() => {
      fetch(`/api/places/autocomplete?q=${encodeURIComponent(query)}`)
        .then((res) => (res.ok ? res.json() : { suggestions: [] }))
        .then((data) => {
          if (cancelled) return
          const rows: AddressSuggestion[] = Array.isArray(data?.suggestions) ? data.suggestions : []
          setSuggestions(rows)
          setHighlighted(0)
          setOpen(rows.length > 0)
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestions([])
            setOpen(false)
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [value])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const choose = (suggestion: AddressSuggestion) => {
    selectedLabelRef.current = suggestion.label
    onChange(suggestion.label)
    onSelect(suggestion)
    setSuggestions([])
    setOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((index) => (index + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((index) => (index - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(suggestions[highlighted] || suggestions[0])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          selectedLabelRef.current = null
          onChange(event.target.value)
          onSelect(null)
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClassName}
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400" aria-hidden="true">
          Buscando...
        </span>
      )}
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-60 overflow-y-auto rounded-xl border border-white/15 bg-zinc-950/98 p-1 shadow-2xl backdrop-blur-xl"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} role="option" aria-selected={index === highlighted}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(suggestion)}
                onMouseEnter={() => setHighlighted(index)}
                className={`w-full rounded-lg px-3 py-2 text-left transition ${
                  index === highlighted ? 'bg-emerald-500/15' : 'hover:bg-white/5'
                }`}
              >
                <span className="block truncate text-xs font-semibold text-white">{suggestion.label}</span>
                <span className="block truncate text-[10px] text-zinc-400">{suggestion.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
