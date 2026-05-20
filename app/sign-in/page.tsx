'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [recoverySent, setRecoverySent] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  const showToast = useCallback((message: string, type: 'error' | 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password.', 'error')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    if (email === 'admin@localplug.com' && password === 'Admin@123') {
      router.push('/admin')
    } else {
      showToast('Invalid email or password. Please try again.', 'error')
    }
    setLoading(false)
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      showToast('Please enter your email address.', 'error')
      return
    }
    setRecoverySent(true)
  }

  return (
    <div className="min-h-screen bg-[#0b0d14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(40, 43, 56, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(40, 43, 56, 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow */}
      <div className="fixed top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[rgba(16,185,129,0.12)] blur-[120px] pointer-events-none" />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-[10px] shadow-lg flex items-center gap-3 text-sm font-medium animate-slide-up ${
            toast.type === 'error'
              ? 'bg-[#181b25] border border-[#ef4450] text-[#ef4450]'
              : 'bg-[#181b25] border border-[#10b981] text-[#10b981]'
          }`}
        >
          {toast.type === 'error' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Sign In Card */}
      <div className="w-full max-w-[420px] bg-[#181b25] border border-[#282b38] rounded-[18px] p-10 relative shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-bold text-[22px] mb-6">
          LP
        </div>
        <h1 className="text-[22px] font-bold text-[#f0f2f5] mb-1">Welcome back</h1>
        <p className="text-[14px] text-[#646880] mb-8">Sign in to your admin account</p>

        <form onSubmit={handleSignIn} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#9ca0b0]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@localplug.com"
              className="w-full px-3.5 py-2.5 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[14px] text-[#f0f2f5] placeholder:text-[#646880] outline-none transition-all duration-200 focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#9ca0b0]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 pr-10 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[14px] text-[#f0f2f5] placeholder:text-[#646880] outline-none transition-all duration-200 focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#646880] hover:text-[#9ca0b0] transition-colors"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-[#282b38] text-[#10b981] focus:ring-[#10b981]/20 bg-[#0b0d14]" />
              <span className="text-[13px] text-[#9ca0b0]">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-[13px] font-medium text-[#10b981] hover:text-[#34d399] transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#10b981] text-white rounded-[6px] font-medium text-[14px] hover:bg-[#059669] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-6"
          onClick={() => { setForgotOpen(false); setRecoverySent(false) }}
        >
          <div
            className="w-full max-w-[440px] bg-[#181b25] border border-[#282b38] rounded-[18px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            {recoverySent ? (
              <>
                <div className="w-14 h-14 rounded-full bg-[rgba(16,185,129,0.12)] flex items-center justify-center text-[#10b981] mx-auto mb-5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <h2 className="text-[18px] font-bold text-[#f0f2f5] text-center mb-2">Check your email</h2>
                <p className="text-[14px] text-[#646880] text-center mb-6">
                  We&apos;ve sent a recovery link to <strong className="text-[#f0f2f5]">{forgotEmail}</strong>
                </p>
                <button
                  onClick={() => { setForgotOpen(false); setRecoverySent(false) }}
                  className="w-full py-2.5 bg-[#10b981] text-white rounded-[6px] font-medium text-[14px] hover:bg-[#059669] transition-all"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[18px] font-bold text-[#f0f2f5]">Reset password</h2>
                  <button onClick={() => setForgotOpen(false)} className="text-[#646880] hover:text-[#f0f2f5] transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
                <p className="text-[14px] text-[#646880] mb-6">Enter your email and we&apos;ll send you a recovery link.</p>
                <form onSubmit={handleForgotSubmit} className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-[#9ca0b0]">Email address</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[14px] text-[#f0f2f5] placeholder:text-[#646880] outline-none transition-all duration-200 focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setForgotOpen(false); setRecoverySent(false) }}
                      className="flex-1 py-2.5 bg-transparent border border-[#282b38] text-[#f0f2f5] rounded-[6px] font-medium text-[14px] hover:bg-[#202330] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#10b981] text-white rounded-[6px] font-medium text-[14px] hover:bg-[#059669] transition-all"
                    >
                      Send Recovery Link
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
