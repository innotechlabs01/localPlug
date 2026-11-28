import { Suspense } from 'react'
import AuthStatusBanner from '@/app/components/auth/auth-status-banner'
import LazyChatWidget from '@/app/components/chat/lazy-chat-widget'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Suspense fallback={null}>
        <AuthStatusBanner />
      </Suspense>
      {children}
      <LazyChatWidget />
    </>
  )
}
