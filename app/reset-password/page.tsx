'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

interface Rule {
  label: string
  test: (pw: string) => boolean
}

export default function ResetPasswordPage() {
  const { t } = useI18n()
  const rules: Rule[] = useMemo(() => [
    { label: t.resetPassword.rulesMin || 'Min 8 characters', test: (pw: string) => pw.length >= 8 },
    { label: t.resetPassword.rulesUpper || '1 uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
    { label: t.resetPassword.rulesLower || '1 lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
    { label: t.resetPassword.rulesNumber || '1 number', test: (pw: string) => /\d/.test(pw) },
    { label: t.resetPassword.rulesSpecial || '1 special character', test: (pw: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
  ], [t])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const passwordChecks = useMemo(
    () => rules.map((r) => ({ label: r.label, passed: r.test(newPassword) })),
    [newPassword],
  )

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0
  const allRulesPass = passwordChecks.every((c) => c.passed)
  const canSubmit = currentPassword.length > 0 && allRulesPass && passwordsMatch

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0b0d14] flex items-center justify-center p-6 relative overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(40, 43, 56, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(40, 43, 56, 0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="fixed top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[rgba(16,185,129,0.12)] blur-[120px] pointer-events-none" />
        <div className="w-full max-w-[420px] bg-[#181b25] border border-[#282b38] rounded-[18px] p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="w-14 h-14 rounded-full bg-[rgba(16,185,129,0.12)] flex items-center justify-center text-[#10b981] mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <h2 className="text-[18px] font-bold text-[#f0f2f5] mb-2">{t.resetPassword.success || 'Password reset successful'}</h2>
          <p className="text-[14px] text-[#646880] mb-6">{t.resetPassword.successDesc || 'Your password has been updated successfully.'}</p>
          <Link
            href="/sign-in"
            className="inline-block w-full py-2.5 bg-[#10b981] text-white rounded-[6px] font-medium text-[14px] hover:bg-[#059669] transition-all text-center"
          >
            {t.resetPassword.backToSignIn || 'Back to Sign In'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0d14] flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(40, 43, 56, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(40, 43, 56, 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div className="fixed top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[rgba(16,185,129,0.12)] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] bg-[#181b25] border border-[#282b38] rounded-[18px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <Link href="/sign-in" className="inline-flex items-center gap-1.5 text-[13px] text-[#646880] hover:text-[#10b981] transition-colors mb-6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          {t.resetPassword.backToSignIn || 'Back to sign in'}
        </Link>
        <h1 className="text-[22px] font-bold text-[#f0f2f5] mb-1">{t.resetPassword.title || 'Reset password'}</h1>
        <p className="text-[14px] text-[#646880] mb-8">{t.resetPassword.subtitle || 'Enter your current password and choose a new one.'}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#9ca0b0]">{t.resetPassword.currentPassword || 'Current Password'}</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t.resetPassword.currentPasswordPlaceholder || 'Enter current password'}
                className="w-full px-3.5 py-2.5 pr-10 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[14px] text-[#f0f2f5] placeholder:text-[#646880] outline-none transition-all duration-200 focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#646880] hover:text-[#9ca0b0]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showCurrent ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#9ca0b0]">{t.resetPassword.newPassword || 'New Password'}</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.resetPassword.newPasswordPlaceholder || 'Enter new password'}
                className="w-full px-3.5 py-2.5 pr-10 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[14px] text-[#f0f2f5] placeholder:text-[#646880] outline-none transition-all duration-200 focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#646880] hover:text-[#9ca0b0]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showNew ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                </svg>
              </button>
            </div>
          </div>

          {/* Password strength checklist */}
          {newPassword.length > 0 && (
            <div className="bg-[#0b0d14] border border-[#282b38] rounded-[8px] p-3.5 space-y-2">
              {passwordChecks.map((check) => (
                <div key={check.label} className="flex items-center gap-2.5 text-[12px]">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${
                      check.passed ? 'bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-[#ef4450]'
                    }`}
                  />
                  <span
                    className={`transition-colors duration-300 ${
                      check.passed ? 'text-[#10b981]' : 'text-[#646880]'
                    }`}
                  >
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#9ca0b0]">{t.resetPassword.confirmPassword || 'Confirm New Password'}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.resetPassword.confirmPasswordPlaceholder || 'Confirm new password'}
                className="w-full px-3.5 py-2.5 pr-10 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[14px] text-[#f0f2f5] placeholder:text-[#646880] outline-none transition-all duration-200 focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#646880] hover:text-[#9ca0b0]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showConfirm ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                </svg>
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <span className={`text-[11px] mt-0.5 ${passwordsMatch ? 'text-[#10b981]' : 'text-[#ef4450]'}`}>
                {passwordsMatch ? (t.resetPassword.match || 'Passwords match') : (t.resetPassword.noMatch || 'Passwords do not match')}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 bg-[#10b981] text-white rounded-[6px] font-medium text-[14px] hover:bg-[#059669] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.resetPassword.reset || 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
