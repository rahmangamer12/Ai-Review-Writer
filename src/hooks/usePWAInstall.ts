'use client';

import { useState, useEffect, useCallback } from 'react';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone === true
        || window.matchMedia('(display-mode: fullscreen)').matches
        || window.matchMedia('(display-mode: minimal-ui)').matches;

      if (isStandalone) {
        setIsInstalled(true);
        setCanInstall(false);
      }
      setIsChecking(false);
    };

    checkStandalone();

    // Define handlers inside useEffect to avoid stale closures
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
      setIsInstalled(false);
      console.log('PWA: Install prompt available');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      console.log('PWA: App installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const timeout = setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        setCanInstall(false);
        setIsChecking(false);
      }
    }, 3000);

    // CRITICAL: Proper cleanup to prevent memory leaks
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timeout);
    };
  }, []); // Empty dependency array - handlers defined inside useEffect

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setCanInstall(false);
          return true;
        }
      } catch (error) {
        console.error('PWA install error:', error);
      }
    }
    return false;
  }, [deferredPrompt]);

  const triggerInstall = useCallback(async () => {
    if (isInstalled) {
      return { success: false, reason: 'already_installed' };
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          return { success: true, reason: 'installed' };
        }
        return { success: false, reason: 'dismissed' };
      } catch (error) {
        return { success: false, reason: 'error' };
      }
    }

    return { success: false, reason: 'no_prompt' };
  }, [deferredPrompt, isInstalled]);

  return {
    canInstall,
    isInstalled,
    isChecking,
    promptInstall,
    triggerInstall,
    deferredPrompt
  };
};
