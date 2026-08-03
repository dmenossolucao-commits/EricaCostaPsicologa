import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { SiteProvider } from './context/SiteContext';
import { TenantProvider } from './context/TenantContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TenantProvider>
      <SiteProvider>
        <App />
      </SiteProvider>
    </TenantProvider>
  </StrictMode>,
);
