'use client';

import { useEffect } from 'react';

/**
 * PWAPurge Component
 * 
 * Aggressively unregisters all service workers and deletes all caches
 * to force a clean slate for the new PWA implementation.
 */
export default function PWAPurge() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 1. Unregister all service workers
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
            console.log('☢️ PWA NUCLEAR RESET: SW Unregistered:', registration.scope);
          }
        })
        .catch(err => console.error('PWA Reset Error (SW):', err));

      // 2. Clear all browser caches
      if ('caches' in window) {
        caches.keys()
          .then((names) => {
            for (const name of names) {
              caches.delete(name);
              console.log('☢️ PWA NUCLEAR RESET: Cache Deleted:', name);
            }
          })
          .catch(err => console.error('PWA Reset Error (Cache):', err));
      }
      
      // 3. Clear PWA related flags to reset the install UI logic
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-dismissed-time');
    }
  }, []);

  return null;
}
