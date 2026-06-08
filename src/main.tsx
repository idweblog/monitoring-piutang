import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and handle any injection/extension-related errors gracefully 
// to prevent external wallet scripts or MetaMask from interrupting application runtime
if (typeof window !== 'undefined') {
  const isExtensionError = (msg: string): boolean => {
    const lowercaseMsg = msg.toLowerCase();
    return (
      lowercaseMsg.includes('metamask') || 
      lowercaseMsg.includes('ethereum') || 
      lowercaseMsg.includes('wallet') ||
      lowercaseMsg.includes('rpc')
    );
  };

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (isExtensionError(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      console.warn('[Extension Guard] Prevented external error from breaking runtime:', msg);
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason instanceof Error ? reason.message : String(reason);
    if (isExtensionError(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      console.warn('[Extension Guard] Prevented external unhandled rejection from breaking runtime:', msg);
    }
  }, true);
}

// Register Service Worker for PWA (Progressive Web App) Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA] Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
