'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePWAInstall Hook
 * 
 * Bulletproof event catcher for PWA installation prompts.
 * Handles the beforeinstallprompt event and provides a consistent interface
 * for triggering the install dialog.
 */
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // 1. Check if already installed via display-mode
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone === true; // iOS Safari
      
      if (isStandalone) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    // 2. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent browser from showing the native prompt automatically
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setCanInstall(true);
      setIsInstalled(false);
      console.log('✅ PWA: beforeinstallprompt caught');
    };

    // 3. Listen for appinstalled (Native event when install finishes)
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      console.log('✅ PWA: App successfully installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn('⚠️ PWA: No install prompt available');
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`👤 PWA: User choice was ${outcome}`);
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ PWA: Install error', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    canInstall,
    isInstalled,
    promptInstall,
    deferredPrompt
  };
};
