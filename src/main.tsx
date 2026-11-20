import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

function setupPWAUpdateSync() {
  if (typeof window === 'undefined' || import.meta.env.DEV) return;

  let isRefreshing = false;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (isRefreshing) return;
      isRefreshing = true;
      window.location.reload();
    });
  }

  const checkForUpdates = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await registration.update().catch(() => {});
        }
      }

      const currentScripts = Array.from(document.querySelectorAll('script[type="module"][src]'))
        .map((s) => s.getAttribute('src') || '')
        .find((src) => src.includes('assets/index-'));

      if (currentScripts) {
        const res = await fetch(`./index.html?_sync=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        if (res.ok) {
          const html = await res.text();
          const match = html.match(/src="([^"]*assets\/index-[^"]+\.js)"/);
          const remoteScript = match?.[1];

          if (remoteScript && remoteScript !== currentScripts) {
            const lastReloadedTarget = sessionStorage.getItem('mixtape_sync_target');
            if (lastReloadedTarget !== remoteScript) {
              sessionStorage.setItem('mixtape_sync_target', remoteScript);

              if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
              }
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.update().catch(() => {})));
              }
              if (!isRefreshing) {
                isRefreshing = true;
                window.location.reload();
              }
            }
          }
        }
      }
    } catch {
      // Ignore offline errors
    }
  };

  checkForUpdates();
  window.addEventListener('focus', checkForUpdates);
  window.addEventListener('online', checkForUpdates);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates();
    }
  });
}

const initialTextSize = localStorage.getItem('pulse_text_size') || 'medium';
document.documentElement.setAttribute('data-text-size', initialTextSize);

// Tema único oscuro elegante
document.documentElement.setAttribute('data-theme-mode', 'dark');
document.documentElement.classList.remove('light');
document.documentElement.classList.add('dark');

setupPWAUpdateSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
