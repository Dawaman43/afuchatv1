import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

// Service worker is automatically registered by vite-plugin-pwa
// The registration happens automatically when the app loads

// Hide the loading indicator once React is ready
const hideLoader = () => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 300);
  }
};

// Register for push notifications if supported
const registerPushNotifications = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('[PWA] Service worker ready:', registration.scope);
    } catch (error) {
      console.log('[PWA] Service worker registration failed:', error);
    }
  }
};

// Initialize PWA features
const initPWA = async () => {
  // Register push notifications
  await registerPushNotifications();
  
  // Log PWA status
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
  
  if (isStandalone) {
    console.log('[PWA] Running in standalone mode');
    document.documentElement.classList.add('pwa-standalone');
  }
};

// Initialize app
initPWA();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Hide loader after render
hideLoader();
