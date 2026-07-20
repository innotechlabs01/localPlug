import ChatWidget from '@/app/components/chat/ChatWidget'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  )
}
