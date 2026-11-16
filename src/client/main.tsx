import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { getReduceMotion } from './fx/motionPref';
import './styles/app.css';

document.documentElement.dataset.reduceMotion = String(getReduceMotion());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
