'use client'

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    // Temporarily disabled - will enable after fixing manifest issue
    console.log('⚠️ Service Worker temporarily disabled');

    // Unregister existing service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log('🗑️ Unregistered old service worker');
        });
      });
    }
  }, []);

  return null;
}