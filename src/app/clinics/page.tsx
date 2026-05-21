import type { Metadata } from 'next'
import IndustryLandingPage from '../(marketing)/IndustryLandingPage'

export const metadata: Metadata = {
  title: 'AI Review Management for Clinics | Ai Review Writer',
  description: 'Help clinics organize patient reviews, draft careful AI replies, and track reputation issues with owner approval.',
}

export default function ClinicsPage() {
  return (
    <IndustryLandingPage
      slug="clinics"
      industry="clinic"
      audience="clinic owners and front-desk teams"
      pain="Patient reviews need careful language, fast attention, and human approval before any public response."
      outcome="Use it to draft professional replies, spot recurring complaints about wait times or communication, and keep sensitive responses under manager control."
      examples={[
        'Draft careful replies that avoid over-sharing private patient information.',
        'Track negative reviews about wait time, appointment handling, or staff behavior.',
        'Give managers one place to review, edit, approve, or delete responses.',
      ]}
    />
  )
}
