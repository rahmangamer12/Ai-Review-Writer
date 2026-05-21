import type { Metadata } from 'next'
import IndustryLandingPage from '../(marketing)/IndustryLandingPage'

export const metadata: Metadata = {
  title: 'AI Review Management for Repair Shops | Ai Review Writer',
  description: 'Help auto, phone, and appliance repair shops track reviews, draft replies, and manage customer trust from one workspace.',
}

export default function RepairShopsPage() {
  return (
    <IndustryLandingPage
      slug="repair-shops"
      industry="repair shop"
      audience="repair shop owners and service teams"
      pain="Repair customers often mention pricing, delays, warranty concerns, or trust issues that need a fast and professional response."
      outcome="Use it to reply to service complaints, thank repeat customers, identify recurring operational issues, and keep the owner focused on urgent reviews."
      examples={[
        'Draft replies for pricing disputes, delayed repairs, and warranty concerns.',
        'Track low-star reviews that mention technician behavior or service quality.',
        'Organize Google reviews and AI reply drafts in one simple dashboard.',
      ]}
    />
  )
}
