'use client'

import { usePathname } from 'next/navigation'
import AIChatbot from '@/components/AIChatbotWidget'

/**
 * Renders the floating AI chatbot widget ONLY on pages where it's not redundant.
 * - Hidden on /chat (user is already on the full chat page)
 * - Hidden on / (landing page — not signed in, no need for support widget)
 */
export default function ConditionalChatbot() {
  const pathname = usePathname()

  // Pages where floating widget would conflict or be redundant
  const hiddenPaths = ['/chat', '/']
  if (hiddenPaths.some(p => pathname === p || pathname.startsWith('/chat/'))) {
    return null
  }

  return <AIChatbot />
}
