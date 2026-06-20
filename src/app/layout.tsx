import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import ClientOnly from "@/components/ClientOnly";
import DynamicBackground from "@/components/DynamicBackground";
import FeedbackWidget from "@/components/FeedbackWidget";
import ConditionalChatbot from "@/components/ConditionalChatbot";
import HydrationSuppressor from "@/components/HydrationSuppressor";
import HydrationFix from "@/components/HydrationFix";
import PWAUpdateNotification from "@/components/PWAUpdateNotification";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClerkProvider } from '@clerk/nextjs'
import { ToastProvider } from '@/components/ui/Toast'

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ai Review Writer | AI Review Management for Local Businesses",
  description: "Ai Review Writer helps restaurants, clinics, salons, repair shops, and local service teams track reviews, analyze sentiment, and draft safer AI replies.",
  keywords: ["local business review management", "Google reviews AI", "restaurant review replies", "clinic review management", "salon review software", "repair shop reviews", "AI review response generator"],
  authors: [{ name: "Ai Review Writer Team" }],
  openGraph: {
    title: "Ai Review Writer - AI Review Management for Local Businesses",
    description: "Track reviews, draft safer AI replies, and protect local reputation from one focused workspace.",
    type: "website",
    url: "https://ai-review-writer.vercel.app",
    siteName: "Ai Review Writer"
  },
  twitter: {
    card: "summary_large_image",
    title: "Ai Review Writer | Local Review Management With AI",
    description: "Manage local customer reviews and AI reply drafts from one workspace."
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      publishableKey={publishableKey}
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
          {/* PWA Meta Tags */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#6366f1" />
          <link rel="icon" type="image/png" href="/app-logo.png" />
          
          {/* iOS PWA Meta Tags - Fixed for all devices */}
          <link rel="apple-touch-icon" href="/app-logo.png" />
          
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Ai Review Writer" />
          
          {/* Additional PWA meta tags for better device support */}
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="application-name" content="Ai Review Writer" />
          <meta name="msapplication-TileColor" content="#6366f1" />
          <meta name="msapplication-tap-highlight" content="no" />
          <meta name="full-screen" content="yes" />
          
          {/* Preconnect for performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body
          className={cn(geistSans.variable, geistMono.variable, "antialiased bg-background text-foreground overflow-x-hidden max-w-[100vw]")}
          suppressHydrationWarning
        >
          <DynamicBackground />
          <ErrorBoundary>
            <ToastProvider>
            <div className="flex flex-col lg:flex-row min-h-[100dvh] max-w-[100vw] relative z-10" suppressHydrationWarning>
              <Navigation />
              <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pt-[calc(57px+env(safe-area-inset-top))] lg:pt-0 pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0 min-w-0 max-w-full lg:pl-64 xl:pl-72 outline-none bg-[#030308]" suppressHydrationWarning>
                <div className="w-full min-h-full px-0 md:px-6 lg:px-8 max-w-full" suppressHydrationWarning>
                  {children}
                </div>
              </main>
            </div>
            </ToastProvider>
          </ErrorBoundary>
          
          {/* Hydration Suppressor for browser extension attributes */}
          <HydrationSuppressor />

          <HydrationFix />

          {/* AI Customer Support Chatbot - Floating Widget */}
          <ConditionalChatbot />

          {/* Feedback Widget */}
          <FeedbackWidget />

          {/* PWA Update & Offline Notifications */}
          <PWAUpdateNotification />

          {/* PWA Smart Install Banner for Mobile */}
          <PWAInstallBanner />
        </body>
      </html>
    </ClerkProvider>
  );
}
