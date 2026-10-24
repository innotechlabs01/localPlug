'use client'

import dynamic from 'next/dynamic'

const LazyChatWidget = dynamic(() => import('@/app/components/chat/ChatWidget'), {
  ssr: false,
  loading: () => null,
})

export default function LazyChatWidgetClient() {
  return <LazyChatWidget />
}
