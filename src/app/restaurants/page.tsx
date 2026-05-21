import type { Metadata } from 'next'
import IndustryLandingPage from '../(marketing)/IndustryLandingPage'

export const metadata: Metadata = {
  title: 'AI Review Management for Restaurants | Ai Review Writer',
  description: 'Help restaurants track Google reviews, draft AI replies, handle negative feedback, and protect local reputation from one dashboard.',
}

export default function RestaurantsPage() {
  return (
    <IndustryLandingPage
      slug="restaurants"
      industry="restaurant"
      audience="restaurant owners and managers"
      pain="A late reply to a bad dining review can cost trust before the next customer even books a table."
      outcome="Use it to respond to food quality complaints, thank loyal customers, track recurring service issues, and keep the owner informed about reviews that need attention."
      examples={[
        'Draft warm replies for 5-star dining experiences without sounding copy-pasted.',
        'Flag low-star reviews about staff, delivery, cleanliness, or wait times.',
        'Keep AI replies editable so sensitive complaints still get owner review.',
      ]}
    />
  )
}
