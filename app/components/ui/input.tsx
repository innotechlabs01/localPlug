'use client'

import { useState } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export default function Input({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-label-md text-slate-navy"
      >
        {label}
        {props.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={inputId}
        className={`w-full px-3 py-3 border rounded text-body-md text-slate-navy bg-white placeholder:text-cool-slate-400 transition-all duration-200 outline-none ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-cool-slate-300 focus:border-mountain-emerald focus:ring-2 focus:ring-mountain-emerald/20'
        } ${className}`}
        onFocus={(e) => {
          setFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          props.onBlur?.(e)
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
