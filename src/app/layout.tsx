import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import ClientOnly from "@/components/ClientOnly";
import DynamicBackground from "@/components/DynamicBackground";
import FeedbackWidget from "@/components/FeedbackWidget";
import AIChatbot from "@/components/AIChatbot";
import HydrationSuppressor from "@/components/HydrationSuppressor";
import { ClerkProvider } from '@clerk/nextjs'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoReview AI - Intelligent Review Management",
  description: "Automated customer review management with AI-powered sentiment analysis and intelligent responses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Pre-hydration script to suppress browser extension attributes - Client Only */}
          <script
            suppressHydrationWarning
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
                            if (node.hasAttribute && node.hasAttribute('bis_skin_checked')) needsClean = true;
                            if (node.querySelector && node.querySelector('[bis_skin_checked]')) needsClean = true;
                          }
                        }
                      }
                      if (needsClean) removeBisAttr();
                    });
                    if (document.body) {
                      observer.observe(document.body, { childList: true, subtree: true });
                    }
                  }
                  // Run immediately and setup observer
                  removeBisAttr();
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', observe);
                  } else {
                    observe();
                  }
                  // Periodic cleanup
                  setInterval(removeBisAttr, 500);
                })();
              `,
            }}
          />
        </head>
        <body
          className={cn(geistSans.variable, geistMono.variable, "antialiased bg-background text-foreground")}
          suppressHydrationWarning
        >
          <ClientOnly>
            <DynamicBackground />
          </ClientOnly>
          <div className="flex h-screen relative z-10" suppressHydrationWarning>
            <Navigation />
            <main className="flex-1 overflow-y-auto custom-scrollbar pt-[57px] lg:pt-0" suppressHydrationWarning>
              {children}
            </main>
          </div>
          
          {/* Hydration Suppressor for browser extension attributes */}
          <HydrationSuppressor />
          
          {/* AI Customer Support Chatbot - RIGHT SIDE - 24/7 Available */}
          <ClientOnly>
            <AIChatbot />
          </ClientOnly>
          
          {/* Feedback Widget - LEFT SIDE */}
          <ClientOnly>
            <FeedbackWidget />
          </ClientOnly>
        </body>
      </html>
    </ClerkProvider>
  );
}
