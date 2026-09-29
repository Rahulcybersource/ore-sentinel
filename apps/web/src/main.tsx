import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AdapterProvider } from './data/adapters/AdapterContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdapterProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AdapterProvider>
  </StrictMode>
);
