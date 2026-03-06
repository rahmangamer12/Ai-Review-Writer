'use client'

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    // Register service worker only on client side
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      const registerServiceWorker = async () => {
        try {
          // Wait for window to load to avoid hydration issues
          if (document.readyState === 'loading') {
            await new Promise<void>((resolve) => {
              window.addEventListener('load', () => resolve());
            });
          }

          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('✅ Service Worker registered:', registration.scope);
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      };

      // Delay registration to avoid hydration issues
      const timer = setTimeout(registerServiceWorker, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}