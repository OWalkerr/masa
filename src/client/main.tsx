import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installUnlock } from './audio/sound';
import { getReduceMotion } from './fx/motionPref';
import './styles/app.css';

document.documentElement.dataset.reduceMotion = String(getReduceMotion());
installUnlock();

// Ana ekrana ekleme ve hızlı açılış (yalnızca yayında; geliştirmede önbellek kafa karıştırır)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
