import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import ClientOnly from "@/components/ClientOnly";
import DynamicBackground from "@/components/DynamicBackground";
import FeedbackWidget from "@/components/FeedbackWidget";
import AIChatbot from "@/components/AIChatbotWidget";
import HydrationSuppressor from "@/components/HydrationSuppressor";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAUpdateNotification from "@/components/PWAUpdateNotification";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ClerkProvider } from '@clerk/nextjs'

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
          <meta name="theme-color" content="#8b5cf6" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="AutoReview AI" />
          
          {/* Service Worker Registration moved to Client Component */}
          {/* Moved to PWAUpdateNotification component to avoid hydration issues */}
        </head>
        <body
          className={cn(geistSans.variable, geistMono.variable, "antialiased bg-background text-foreground")}
          suppressHydrationWarning
        >
          <DynamicBackground />
          <ErrorBoundary>
            <div className="flex flex-col lg:flex-row min-h-[100dvh] relative z-10" suppressHydrationWarning>
              <Navigation />
              <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pt-[57px] lg:pt-0 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-[calc(1rem+env(safe-area-inset-bottom))] min-w-0 lg:pl-64 xl:pl-72" suppressHydrationWarning>
                <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
                  {children}
                </div>
              </main>
            </div>
          </ErrorBoundary>
          
          {/* Hydration Suppressor for browser extension attributes */}
          <HydrationSuppressor />

          {/* AI Customer Support Chatbot - Floating Widget (outside scroll container) */}
          <AIChatbot />

          {/* Feedback Widget - LEFT SIDE (outside scroll container) */}
          <FeedbackWidget />

          {/* PWA Install Prompt (outside scroll container) */}
          <PWAInstallPrompt />

          {/* PWA Update & Offline Notifications (outside scroll container) */}
          <PWAUpdateNotification />

          {/* Hydration Suppression Script - Using Next.js Script component to avoid warnings */}
          <Script
            id="hydration-suppressor-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  if (typeof window === 'undefined') return;
                  var observer;
                  function removeBisAttr() {
                    var els = document.querySelectorAll('[bis_skin_checked]');
                    for (var i = 0; i < els.length; i++) {
                      els[i].removeAttribute('bis_skin_checked');
                    }
                  }
                  function observe() {
                    if (observer) observer.disconnect();
                    observer = new MutationObserver(function(mutations) {
                      var needsClean = false;
                      for (var m = 0; m < mutations.length; m++) {
                        var nodes = mutations[m].addedNodes;
                        for (var n = 0; n < nodes.length; n++) {
                          var node = nodes[n];
                          if (node.nodeType === 1) {
                            if (node && node.hasAttribute && node.hasAttribute('bis_skin_checked')) needsClean = true;
                            if (node && node.querySelector && node.querySelector('[bis_skin_checked]')) needsClean = true;
                          }
                        }
                      }
                      if (needsClean) removeBisAttr();
                    });
                    if (document.body) {
                      observer.observe(document.body, { childList: true, subtree: true });
                    }
                  }
                  removeBisAttr();
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', observe);
                  } else {
                    observe();
                  }
                  setInterval(removeBisAttr, 1000);
                })();
              `,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
