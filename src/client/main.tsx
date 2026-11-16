import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installUnlock } from './audio/sound';
import { getReduceMotion } from './fx/motionPref';
import './styles/app.css';

document.documentElement.dataset.reduceMotion = String(getReduceMotion());
installUnlock();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
