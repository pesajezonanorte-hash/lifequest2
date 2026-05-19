import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { PWAInstallBanner } from './components/ui/PWAInstallBanner';
import './styles/globals.css';

// Apply saved theme preference immediately to avoid flash
// Default is always 'dark' regardless of system preference
const savedTheme = localStorage.getItem('theme') ?? 'dark';
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else if (savedTheme === 'light') {
  document.documentElement.classList.add('light');
} else {
  // 'system' mode
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.add(systemDark ? 'dark' : 'light');
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed silently — non-critical
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <PWAInstallBanner />
    </BrowserRouter>
  </StrictMode>
);
