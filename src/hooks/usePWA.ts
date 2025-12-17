import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  swRegistration: ServiceWorkerRegistration | null;
  swUpdateAvailable: boolean;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isStandalone: false,
    isOnline: navigator.onLine,
    canInstall: false,
    isIOS: false,
    isAndroid: false,
    swRegistration: null,
    swUpdateAvailable: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Detect platform and installation state
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    const isInstalled = isStandalone || localStorage.getItem('pwa-installed') === 'true';

    setState(prev => ({
      ...prev,
      isIOS,
      isAndroid,
      isStandalone,
      isInstalled,
    }));

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        isStandalone: e.matches,
        isInstalled: e.matches,
      }));
      if (e.matches) {
        localStorage.setItem('pwa-installed', 'true');
      }
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);
    return () => mediaQuery.removeEventListener('change', handleDisplayModeChange);
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState(prev => ({ ...prev, canInstall: true }));
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
      setState(prev => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle service worker registration and updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setState(prev => ({ ...prev, swRegistration: registration }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, swUpdateAvailable: true }));
              }
            });
          }
        });
      });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  // Install the PWA
  const install = useCallback(async () => {
    if (!deferredPrompt) {
      // For iOS, show instructions
      if (state.isIOS) {
        return {
          success: false,
          message: 'To install on iOS: tap the Share button, then "Add to Home Screen"',
        };
      }
      return { success: false, message: 'Installation not available' };
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        localStorage.setItem('pwa-installed', 'true');
        setState(prev => ({
          ...prev,
          isInstalled: true,
          canInstall: false,
        }));
        return { success: true, message: 'App installed successfully!' };
      }

      return { success: false, message: 'Installation cancelled' };
    } catch (error) {
      console.error('PWA install error:', error);
      return { success: false, message: 'Installation failed' };
    }
  }, [deferredPrompt, state.isIOS]);

  // Update the service worker
  const updateServiceWorker = useCallback(() => {
    if (state.swRegistration?.waiting) {
      state.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [state.swRegistration]);

  // Clear all caches
  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    if (state.swRegistration?.active) {
      state.swRegistration.active.postMessage({ type: 'CLEAR_CACHE' });
    }
    return true;
  }, [state.swRegistration]);

  // Get app version from service worker
  const getVersion = useCallback(async (): Promise<string | null> => {
    if (!state.swRegistration?.active) return null;
    
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data?.version || null);
      };
      state.swRegistration!.active!.postMessage(
        { type: 'GET_VERSION' },
        [channel.port2]
      );
      // Timeout after 1 second
      setTimeout(() => resolve(null), 1000);
    });
  }, [state.swRegistration]);

  return {
    ...state,
    install,
    updateServiceWorker,
    clearCache,
    getVersion,
    deferredPrompt,
  };
};

export default usePWA;
