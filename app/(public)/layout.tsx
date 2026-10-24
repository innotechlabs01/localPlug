import LazyChatWidget from '@/app/components/chat/lazy-chat-widget'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <LazyChatWidget />
    </>
  )
}
