import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { SceneProvider } from './context/SceneProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SceneProvider>
      <App />
    </SceneProvider>
  </StrictMode>,
);
