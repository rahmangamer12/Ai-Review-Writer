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
import ErrorBoundary from "@/components/ErrorBoundary";
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
  title: "AutoReview AI | Automate & Manage Reviews 10x Faster",
  description: "Boost your business reputation with AutoReview AI. Automatically track, analyze, and reply to customer reviews across Google, Yelp, and Facebook using AI.",
  keywords: ["review management", "AI auto reply", "reputation management", "customer reviews AI", "Google reviews software"],
  authors: [{ name: "AutoReview AI Team" }],
  openGraph: {
    title: "AutoReview AI - Intelligent Reputation Management",
    description: "Connect your platforms and let our AI generate personalized, context-aware responses to your customer reviews instantly.",
    type: "website",
    url: "https://ai-review-writer.vercel.app",
    siteName: "AutoReview AI"
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoReview AI | Smart Review Automation",
    description: "Manage your online reputation effortlessly with AI-powered review responses."
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
          <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-96x96.png" />
          
          {/* iOS PWA Meta Tags - Fixed for all devices */}
          <link rel="apple-touch-icon" sizes="96x96" href="/icons/icon-96x96.png" />
          <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.png" />
          <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
          <link rel="apple-touch-icon" sizes="384x384" href="/icons/icon-384x384.png" />
          <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
          
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="AutoReview AI" />
          
          {/* Additional PWA meta tags for better device support */}
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="application-name" content="AutoReview AI" />
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
              <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pt-[calc(57px+env(safe-area-inset-top))] lg:pt-0 pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0 min-w-0 max-w-full lg:pl-64 xl:pl-72 outline-none" suppressHydrationWarning>
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
