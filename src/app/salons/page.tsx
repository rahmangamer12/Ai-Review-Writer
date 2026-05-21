import type { Metadata } from 'next'
import IndustryLandingPage from '../(marketing)/IndustryLandingPage'

export const metadata: Metadata = {
  title: 'AI Review Management for Salons | Ai Review Writer',
  description: 'Help salons reply to customer reviews, track service feedback, and protect local reputation with editable AI drafts.',
}

export default function SalonsPage() {
  return (
    <IndustryLandingPage
      slug="salons"
      industry="salon"
      audience="salon owners and beauty service teams"
      pain="A single unanswered review about a haircut, booking issue, or staff experience can hurt local trust."
      outcome="Use it to thank happy clients, handle unhappy customers with calm replies, and track which services create the most feedback."
      examples={[
        'Draft friendly replies for hair, nail, spa, and beauty service reviews.',
        'Spot common issues around booking, timing, staff, or service quality.',
        'Keep each response editable before the salon uses it publicly.',
      ]}
    />
  )
}
